/**
 * Jotai store bridge — locates the game's Jotai store instance so we can
 * read and write atoms from outside React.
 *
 * Fully standalone — no dependency on AriesMod or any other userscript.
 *
 * Strategy:
 *  1. React fiber traversal — walks __REACT_DEVTOOLS_GLOBAL_HOOK__ to find the
 *     Jotai <Provider value={store}> node. Works as long as React DevTools hook
 *     is present (it always is in Chrome/Firefox).
 *  2. Atom discovery — scans the fiber tree's hook memoizedState to locate atom
 *     objects by their debugLabel. Falls back to window.jotaiAtomCache if
 *     another script has populated it.
 */

export interface JotaiStore {
  get: (atom: unknown) => unknown;
  set: (atom: unknown, value: unknown) => void;
  sub: (atom: unknown, listener: () => void) => () => void;
}

const MAX_WAIT_MS = 15_000;
const POLL_INTERVAL_MS = 250;

let cachedStore: JotaiStore | null = null;

// ---------------------------------------------------------------------------
// Page window helper
// ---------------------------------------------------------------------------
// In Tampermonkey with @grant directives, `window` is a sandboxed proxy.
// The game's React tree and atom cache live on the actual page window, which
// is exposed as `unsafeWindow`.  We use unsafeWindow where available and fall
// back to `window` when running without a sandbox (e.g. @grant none).
declare const unsafeWindow: typeof window;

function getPageWindow(): typeof window {
  try {
    return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  } catch {
    return window;
  }
}

function isStore(value: unknown): value is JotaiStore {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['get'] === 'function' &&
    typeof v['set'] === 'function' &&
    typeof v['sub'] === 'function'
  );
}

// ---------------------------------------------------------------------------
// Store discovery via React fiber
// ---------------------------------------------------------------------------

/**
 * Walks a fiber's hook linked list looking for a jotai v2 useAtomValue hook.
 * That hook stores [currentValue, store, atom] in its useReducer memoizedState.
 * Returns the store (index 1) if found.
 */
function extractStoreFromHookChain(memoizedState: unknown): JotaiStore | null {
  let hook = memoizedState as Record<string, unknown> | null | undefined;
  while (hook) {
    const state = hook['memoizedState'];
    if (Array.isArray(state) && state.length === 3 && isStore(state[1])) {
      return state[1] as JotaiStore;
    }
    hook = hook['next'] as Record<string, unknown> | null | undefined;
  }
  return null;
}

function findStoreViaFiber(): JotaiStore | null {
  const pageWin = getPageWindow();
  const hook = (pageWin as unknown as Record<string, unknown>)['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  if (typeof hook !== 'object' || hook === null) return null;
  const h = hook as Record<string, unknown>;
  if (!(h['renderers'] instanceof Map)) return null;

  for (const [rid] of h['renderers'] as Map<unknown, unknown>) {
    const getFiberRoots = h['getFiberRoots'] as ((id: unknown) => Set<{ current: unknown }>) | undefined;
    if (typeof getFiberRoots !== 'function') continue;
    const roots = getFiberRoots(rid);
    if (!roots) continue;

    for (const root of roots) {
      const stack: unknown[] = [root.current];
      const visited = new Set<unknown>();

      while (stack.length > 0) {
        const fiber = stack.pop();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);

        const f = fiber as Record<string, unknown>;

        // Pass 1: Context.Provider — Jotai <Provider> passes store as context value
        for (const propsKey of ['pendingProps', 'memoizedProps']) {
          const props = f[propsKey] as Record<string, unknown> | null | undefined;
          if (props) {
            const value = props['value'];
            if (isStore(value)) return value;
          }
        }

        // Pass 2: Hook memoizedState — jotai v2 useAtomValue stores [value, store, atom]
        // in a useReducer. Works even when no <Provider> (default store case).
        const storeFromHooks = extractStoreFromHookChain(f['memoizedState']);
        if (storeFromHooks) return storeFromHooks;

        if (f['child']) stack.push(f['child']);
        if (f['sibling']) stack.push(f['sibling']);
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public: get store (waits for React to mount)
// ---------------------------------------------------------------------------

export function getStore(): Promise<JotaiStore> {
  if (cachedStore) return Promise.resolve(cachedStore);

  const immediate = findStoreViaFiber();
  if (immediate) {
    cachedStore = immediate;
    return Promise.resolve(immediate);
  }

  return new Promise<JotaiStore>((resolve, reject) => {
    const deadline = Date.now() + MAX_WAIT_MS;

    const intervalId = setInterval(() => {
      const store = findStoreViaFiber();
      if (store) {
        clearInterval(intervalId);
        cachedStore = store;
        resolve(store);
        return;
      }
      if (Date.now() > deadline) {
        clearInterval(intervalId);
        reject(new Error('[MG-Controller] Could not find Jotai store after waiting.'));
      }
    }, POLL_INTERVAL_MS);
  });
}

// ---------------------------------------------------------------------------
// Atom interceptor — patches store.sub to observe subscriptions at runtime
// ---------------------------------------------------------------------------

/**
 * Wraps `store.sub` so that every new subscription fires `onAtomSeen` with the
 * atom and its current value. Returns an uninstall function that restores the
 * original `store.sub`.
 *
 * Used to discover Pixi-only atoms that are never surfaced in React fibers.
 */
export function installAtomInterceptor(
  store: JotaiStore,
  onAtomSeen: (atom: unknown, value: unknown) => void,
): () => void {
  const originalSub = store.sub;

  store.sub = (atom: unknown, listener: () => void): (() => void) => {
    try {
      const value = store.get(atom);
      onAtomSeen(atom, value);
    } catch {
      // ignore — some atoms may throw on get before they're initialized
    }
    return originalSub(atom, listener);
  };

  return () => {
    store.sub = originalSub;
  };
}

// ---------------------------------------------------------------------------
// Atom discovery
// ---------------------------------------------------------------------------

/**
 * Searches for a Jotai atom object by debugLabel.
 *
 * First checks window.jotaiAtomCache (populated by QPM/other scripts if present),
 * then falls back to scanning the React fiber hook memoizedState chain.
 * Returns the atom object (used as key for store.get/set), or null if not found.
 */
export function findAtomByLabel(label: string): unknown | null {
  // Opportunistic: another script may have already cached atoms
  const atomCacheResult = searchJotaiAtomCache(label);
  if (atomCacheResult !== null) return atomCacheResult;

  // Standalone: scan fiber memoizedState for atom objects
  return findAtomInFibers(label);
}

function searchJotaiAtomCache(label: string): unknown | null {
  const pageWin = getPageWindow();
  const cache = (pageWin as unknown as Record<string, unknown>)['jotaiAtomCache'];
  if (typeof cache !== 'object' || cache === null) return null;
  const cacheMap = (cache as Record<string, unknown>)['cache'];
  if (!(cacheMap instanceof Map)) return null;

  for (const [atomKey] of cacheMap.entries()) {
    if (typeof atomKey !== 'object' || atomKey === null) continue;
    const atomObj = atomKey as Record<string, unknown>;
    const debugLabel = atomObj['debugLabel'];
    const toStr = typeof atomObj['toString'] === 'function' ? atomObj['toString']() : undefined;
    if (debugLabel === label || toStr === label) return atomKey;
  }

  return null;
}

/**
 * Walks the entire React fiber tree looking for hook memoizedState entries
 * that hold a [value, store, atom] triple (jotai v2 useAtomValue pattern).
 * Returns the atom object whose debugLabel matches `label`.
 */
function findAtomInFibers(label: string): unknown | null {
  const pageWin = getPageWindow();
  const hook = (pageWin as unknown as Record<string, unknown>)['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  if (typeof hook !== 'object' || hook === null) return null;
  const h = hook as Record<string, unknown>;
  if (!(h['renderers'] instanceof Map)) return null;

  for (const [rid] of h['renderers'] as Map<unknown, unknown>) {
    const getFiberRoots = h['getFiberRoots'] as ((id: unknown) => Set<{ current: unknown }>) | undefined;
    if (typeof getFiberRoots !== 'function') continue;
    const roots = getFiberRoots(rid);
    if (!roots) continue;

    for (const root of roots) {
      const stack: unknown[] = [root.current];
      const visited = new Set<unknown>();

      while (stack.length > 0) {
        const fiber = stack.pop();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);

        const f = fiber as Record<string, unknown>;
        const atom = searchHooksForAtom(f['memoizedState'], label);
        if (atom !== null) return atom;

        if (f['child']) stack.push(f['child']);
        if (f['sibling']) stack.push(f['sibling']);
      }
    }
  }

  return null;
}

/**
 * Walks a fiber's hook linked list (memoizedState chain).
 * jotai v2 useAtomValue stores [value, store, atom] in a useReducer hook.
 */
function searchHooksForAtom(memoizedState: unknown, label: string): unknown | null {
  let hook = memoizedState as Record<string, unknown> | null | undefined;

  while (hook) {
    const state = hook['memoizedState'];

    // jotai v2: useReducer memoizedState = [currentValue, store, atom]
    if (Array.isArray(state) && state.length === 3) {
      const maybeAtom = state[2];
      if (isAtomWithLabel(maybeAtom, label)) return maybeAtom;
    }

    // Also check direct object (some versions store differently)
    if (isAtomWithLabel(state, label)) return state;

    hook = hook['next'] as Record<string, unknown> | null | undefined;
  }

  return null;
}

function isAtomWithLabel(value: unknown, label: string): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj['debugLabel'] === label) return true;
  if (typeof obj['toString'] === 'function' && obj['toString']() === label) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Atom discovery by value shape
// ---------------------------------------------------------------------------

export interface FiberAtomMatch {
  atom: unknown;
  /** Value read from the fiber hook state (may lag behind store by one render). */
  value: unknown;
}

/**
 * Walks the React fiber tree looking for Jotai v2 useAtomValue hook states
 * ([value, store, atom] triples) where `predicate(value, atom)` returns true.
 *
 * Returns the matched atom together with the fiber-captured value so callers
 * can inspect the value without calling store.get (which has side-effects when
 * it mounts previously-unmounted derived atoms).
 *
 * @param predicate      Called with (currentValue, atomObject). Return true to match.
 * @param minOccurrences Atom must appear in at least this many distinct fibers.
 */
export function findAtomInFibersByValueShape(
  predicate: (value: unknown, atom: unknown) => boolean,
  minOccurrences = 1,
): FiberAtomMatch | null {
  const counts = new Map<unknown, { count: number; value: unknown }>();

  const pageWin = getPageWindow();
  const hook = (pageWin as unknown as Record<string, unknown>)['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  if (typeof hook !== 'object' || hook === null) return null;
  const h = hook as Record<string, unknown>;
  if (!(h['renderers'] instanceof Map)) return null;

  for (const [rid] of h['renderers'] as Map<unknown, unknown>) {
    const getFiberRoots = h['getFiberRoots'] as
      ((id: unknown) => Set<{ current: unknown }>) | undefined;
    if (typeof getFiberRoots !== 'function') continue;
    const roots = getFiberRoots(rid);
    if (!roots) continue;

    for (const root of roots) {
      const stack: unknown[] = [root.current];
      const visited = new Set<unknown>();

      while (stack.length > 0) {
        const fiber = stack.pop();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);

        const f = fiber as Record<string, unknown>;
        accumulateHookMatches(f['memoizedState'], predicate, counts);

        if (f['child']) stack.push(f['child']);
        if (f['sibling']) stack.push(f['sibling']);
      }
    }
  }

  if (minOccurrences <= 1) {
    for (const [atom, { value }] of counts) return { atom, value };
    return null;
  }

  // Return the atom with the highest occurrence count that meets the threshold
  let best: FiberAtomMatch | null = null;
  let bestCount = 0;
  for (const [atom, { count, value }] of counts) {
    if (count >= minOccurrences && count > bestCount) {
      best = { atom, value };
      bestCount = count;
    }
  }
  return best;
}

function accumulateHookMatches(
  memoizedState: unknown,
  predicate: (value: unknown, atom: unknown) => boolean,
  counts: Map<unknown, { count: number; value: unknown }>,
): void {
  let hook = memoizedState as Record<string, unknown> | null | undefined;
  while (hook) {
    const state = hook['memoizedState'];
    // jotai v2: useReducer memoizedState = [currentValue, store, atom]
    if (Array.isArray(state) && state.length === 3 && isStore(state[1])) {
      const [value, , atom] = state;
      if (predicate(value, atom)) {
        const existing = counts.get(atom);
        counts.set(atom, { count: (existing?.count ?? 0) + 1, value });
      }
    }
    hook = hook['next'] as Record<string, unknown> | null | undefined;
  }
}
