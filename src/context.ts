/**
 * Game context reads/writes via Jotai atoms.
 * Provides: modal detection, pet slot cycling, atom discovery via fiber scan.
 *
 * Discovery strategy
 * ------------------
 * Production builds strip debugLabels, so label-based lookup always fails.
 *
 * quinoaEngineAtom: matched by QuinoaEngine shape (worldTextureCache + itemSpriteCache).
 *   Used in 5+ React components → minOccurrences=3 safe, no false positives.
 *   Pet slot cycling traverses engine → systems Map → 'petSlots' → PetSlotsView.
 *
 * activeModalAtom:  matched when a modal is open (distinctive string value).
 *   No false positives because null-init atoms are excluded and the value set
 *   is small and game-specific.
 *
 * NO store.get calls are made during discovery — fiber-captured values are used
 * instead. Calling store.get on an unmounted derived atom has side effects
 * (Jotai mounts it and watches its deps), which can interfere with the game.
 *
 * Pet slot cycling uses PetSlotsView.handleItemSelect() which internally calls
 * set(selectedPetSlotIdAtom, ...) via module-level closure — no direct atom
 * access needed. TypeScript `private` does not affect runtime property access.
 */

import {
  getStore,
  findAtomByLabel,
  findAtomInFibersByValueShape,
  type JotaiStore,
} from './store';

// Cached store — set once initPetSlotAtoms resolves; enables sync access later.
let cachedStore: JotaiStore | null = null;

// ---------------------------------------------------------------------------
// Atom label constants (work on dev / QPM-enriched builds)
// ---------------------------------------------------------------------------

const LABEL_ACTIVE_MODAL = 'activeModalAtom';

// ---------------------------------------------------------------------------
// Cached atom objects — set once, never cleared
// ---------------------------------------------------------------------------

let activeModalAtom:  unknown = null;
let quinoaEngineAtom: unknown = null;

// ---------------------------------------------------------------------------
// Value-shape predicates
// ---------------------------------------------------------------------------

const VALID_MODAL_VALUES = new Set([
  'seedShop', 'eggShop', 'toolShop', 'inventory', 'leaderboard',
  'journal', 'decorShop', 'stats', 'petHutch', 'decorShed',
  'activityLog', 'destroyCelestialConfirmation', 'seedSilo',
  'newspaper', 'billboard', 'feedingTrough',
]);

/**
 * QuinoaEngine has public worldTextureCache and itemSpriteCache properties.
 * These two together are distinctive enough to avoid false positives.
 */
function looksLikeQuinoaEngine(v: unknown): boolean {
  return (
    !!v &&
    typeof v === 'object' &&
    'worldTextureCache' in (v as object) &&
    'itemSpriteCache' in (v as object)
  );
}

// ---------------------------------------------------------------------------
// Sync modal state (cached via atom subscription)
// ---------------------------------------------------------------------------

let cachedModalOpen = false;
let modalAtomSubscribed = false;

/**
 * Synchronous modal check used by GamepadPoller every frame.
 * Falls back to a quick DOM scan if activeModalAtom was never found.
 */
export function isModalOpenSync(): boolean {
  if (cachedModalOpen) return true;
  // DOM fallback: Chakra/McFlex modals have no role="dialog" but use a
  // semi-transparent dark backdrop with rgba(24, 24, 24, …).
  return (
    document.querySelector('[role="dialog"]') !== null ||
    document.querySelector('[style*="rgba(24, 24, 24"]') !== null
  );
}

function subscribeToModalAtom(store: JotaiStore): void {
  if (modalAtomSubscribed || !activeModalAtom) return;
  modalAtomSubscribed = true;
  cachedModalOpen = store.get(activeModalAtom) !== null;
  store.sub(activeModalAtom, () => {
    cachedModalOpen = store.get(activeModalAtom!) !== null;
  });
}

// ---------------------------------------------------------------------------
// Grow slot context detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the player is on a multi-harvest plant tile.
 *
 * The game renders `<IconButton aria-label="Previous [x]">` (ActionBrowseButton)
 * only when numGrowSlots > 1. Checking for that element in the DOM is the
 * simplest reliable signal with no atom access required.
 */
export function isGrowSlotContextActive(): boolean {
  return document.querySelector('button[aria-label="Previous [x]"]') !== null;
}

// ---------------------------------------------------------------------------
// Async modal check (one-off, used by callers who can await)
// ---------------------------------------------------------------------------

export async function isModalOpen(): Promise<boolean> {
  if (activeModalAtom) {
    try {
      const store = await getStore();
      return store.get(activeModalAtom) !== null;
    } catch {
      // fall through to DOM
    }
  }
  return (
    document.querySelector('[role="dialog"]') !== null ||
    document.querySelector('[style*="rgba(24, 24, 24"]') !== null
  );
}

// ---------------------------------------------------------------------------
// Label-based fast path (dev builds / QPM-enriched environments)
// ---------------------------------------------------------------------------

function tryLabelDiscovery(): void {
  if (!activeModalAtom) activeModalAtom = findAtomByLabel(LABEL_ACTIVE_MODAL);
}

// ---------------------------------------------------------------------------
// Fiber value-shape scan helpers
// NOTE: These must NOT call store.get — use only fiber-captured values.
// ---------------------------------------------------------------------------

function tryScanEngineAtom(): void {
  if (quinoaEngineAtom) return;
  const result = findAtomInFibersByValueShape(
    (v) => looksLikeQuinoaEngine(v),
    3, // 5+ React consumers — minOccurrences=3 is a safe threshold
  );
  if (result) quinoaEngineAtom = result.atom;
}

function tryScanModalAtom(): void {
  if (activeModalAtom) return;
  // Only match when a modal is actually open (distinctive string value).
  // Derived atoms (no .init) whose value is null are too common to match safely.
  const result = findAtomInFibersByValueShape(
    (v, atom) => {
      const a = atom as Record<string, unknown>;
      return !('init' in a) && typeof v === 'string' && VALID_MODAL_VALUES.has(v);
    },
  );
  if (result) activeModalAtom = result.atom;
}

// ---------------------------------------------------------------------------
// Boot — call once from main.ts (fire-and-forget)
// ---------------------------------------------------------------------------

const DISCOVERY_TIMEOUT_MS = 60_000;
const DISCOVERY_POLL_MS    = 1_000;

/**
 * Discovers the QuinoaEngine atom (for pet slot cycling) and modal atom.
 * Label lookup first (fast path), then fiber value-shape scan (production).
 *
 * Pet slot cycling is available as soon as quinoaEngineAtom is found and the
 * engine is non-null — no manual user interaction is required.
 */
export async function initPetSlotAtoms(): Promise<void> {
  const store = await getStore();
  cachedStore = store;
  console.log('[MG-Controller] Jotai store connected.');

  // Fast path: labels present (dev / QPM-enriched builds)
  tryLabelDiscovery();
  if (activeModalAtom) subscribeToModalAtom(store);

  // Also try engine scan immediately
  tryScanEngineAtom();

  if (quinoaEngineAtom) {
    console.log('[MG-Controller] Pet slot atoms ready (immediate scan).');
    return;
  }

  return new Promise<void>((resolve) => {
    const deadline = Date.now() + DISCOVERY_TIMEOUT_MS;

    const attempt = (): void => {
      tryScanEngineAtom();
      tryScanModalAtom();

      if (activeModalAtom) subscribeToModalAtom(store);

      if (quinoaEngineAtom) {
        console.log('[MG-Controller] Pet slot atoms ready (fiber scan).');
        resolve();
        return;
      }

      if (Date.now() >= deadline) {
        console.warn('[MG-Controller] Pet slot atom discovery timed out — RT/LT cycling disabled.');
        resolve();
        return;
      }

      setTimeout(attempt, DISCOVERY_POLL_MS);
    };

    attempt();
  });
}

// ---------------------------------------------------------------------------
// Pet slot cycling — via PetSlotsView.handleItemSelect()
// ---------------------------------------------------------------------------

/**
 * Searches up to `depth` levels of object properties for a PetSlotsView,
 * identified by having both `selectedPetSlotId` and `localPetSlots` fields.
 * Skips Maps, Arrays, and primitives to avoid traversing large structures.
 */
function findViewInObject(
  obj: Record<string, unknown>,
  depth: number,
): Record<string, unknown> | null {
  if ('selectedPetSlotId' in obj && 'localPetSlots' in obj) return obj;
  if (depth <= 0) return null;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (!val || typeof val !== 'object' || Array.isArray(val) || val instanceof Map) continue;
    const found = findViewInObject(val as Record<string, unknown>, depth - 1);
    if (found) return found;
  }
  return null;
}

/**
 * Traverses the QuinoaEngine to find the PetSlotsView instance.
 *
 * Path: engine → systems (Map<string, SystemEntry>) → 'petSlots' entry
 *       → PetSlotsSystem (nested) → PetSlotsView
 *
 * PetSlotsView is identified by having both selectedPetSlotId and localPetSlots.
 * TypeScript `private` is compile-time only — properties are accessible at runtime.
 */
function findPetSlotsView(engine: Record<string, unknown>): Record<string, unknown> | null {
  for (const engineKey of Object.keys(engine)) {
    const val = engine[engineKey];
    if (!(val instanceof Map)) continue;

    const petSlotsEntry = (val as Map<unknown, unknown>).get('petSlots');
    if (!petSlotsEntry || typeof petSlotsEntry !== 'object') continue;

    // Search up to 2 levels: SystemEntry → PetSlotsSystem → PetSlotsView
    const view = findViewInObject(petSlotsEntry as Record<string, unknown>, 2);
    if (view) return view;
  }
  return null;
}

/**
 * Cycles to the next or previous pet slot.
 * Cycle order: null → slot[0] → slot[1] → … → null (wraps).
 *
 * Uses PetSlotsView.handleItemSelect() to update both the Jotai atom and
 * Pixi visuals atomically. Works without any prerequisite user interaction.
 *
 * handleItemSelect toggle behavior:
 *   - Called with current ID → deselects (sets null)
 *   - Called with a different ID → selects that slot
 * So to deselect (targetId === null), we call it with the current selectedId.
 */
export async function cyclePetSlot(direction: 'next' | 'prev'): Promise<void> {
  // Re-attempt scan in case engine became available after boot
  tryScanEngineAtom();

  if (!quinoaEngineAtom) {
    console.warn('[MG-Controller] RT/LT: game engine atom not yet discovered.');
    return;
  }

  try {
    const store = await getStore();
    // quinoaEngineAtom is a primitive atom — store.get is safe (no side effects)
    const engine = store.get(quinoaEngineAtom);
    if (!engine || typeof engine !== 'object') {
      console.warn('[MG-Controller] RT/LT: QuinoaEngine not yet initialized.');
      return;
    }

    const view = findPetSlotsView(engine as Record<string, unknown>);
    if (!view) {
      console.warn('[MG-Controller] RT/LT: PetSlotsView not accessible — property names may be mangled.');
      return;
    }

    const localSlots = view['localPetSlots'];
    if (!Array.isArray(localSlots) || localSlots.length === 0) return;

    const slotIds = (localSlots as Array<Record<string, unknown>>)
      .filter((s) => typeof s?.['id'] === 'string')
      .map((s) => s['id'] as string);
    if (slotIds.length === 0) return;

    const selectedId = view['selectedPetSlotId'] as string | null | undefined;
    const cycle: Array<string | null> = [null, ...slotIds];

    const currentIdx = (selectedId == null) ? 0 : cycle.indexOf(selectedId);
    const safeIdx    = currentIdx === -1 ? 0 : currentIdx;

    const nextIdx = direction === 'next'
      ? (safeIdx + 1) % cycle.length
      : (safeIdx - 1 + cycle.length) % cycle.length;

    const targetId = cycle[nextIdx];

    if (typeof view['handleItemSelect'] !== 'function') {
      console.warn('[MG-Controller] RT/LT: handleItemSelect not accessible — property may be mangled.');
      return;
    }

    const handleItemSelect = view['handleItemSelect'] as (id: string) => void;

    if (targetId === null) {
      // Deselect: call with current ID so handleItemSelect toggles it off
      if (selectedId != null) {
        handleItemSelect.call(view, selectedId);
      }
    } else {
      handleItemSelect.call(view, targetId);
    }
  } catch (err) {
    console.error('[MG-Controller] cyclePetSlot failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Pixi interactive point collection (for D-pad snap)
// ---------------------------------------------------------------------------

/**
 * Returns viewport-coordinate centers of all interactive Pixi containers
 * that have `cursor = 'pointer'` (inventory items, world objects, pet slots, etc.).
 *
 * Called synchronously on every D-pad press — traverses the Pixi display tree
 * and collects eligible containers. Skips invisible branches for performance.
 *
 * Coordinate conversion: Pixi's getBounds() returns canvas-local CSS pixels.
 * Adding the canvas element's viewport offset gives us viewport coordinates.
 * For a full-screen game the canvas is at (0,0) so this is usually a no-op.
 */
export function getPixiInteractives(): Array<{ x: number; y: number }> {
  if (!quinoaEngineAtom || !cachedStore) return [];

  const engine = cachedStore.get(quinoaEngineAtom);
  if (!engine || typeof engine !== 'object') return [];

  const app = (engine as Record<string, unknown>)['app'];
  if (!app || typeof app !== 'object') return [];

  // Pixi v8 uses app.canvas; v7 used app.view (keep fallback)
  const canvas = ((app as Record<string, unknown>)['canvas'] ??
                  (app as Record<string, unknown>)['view']) as HTMLCanvasElement | null;
  const stage  = (app as Record<string, unknown>)['stage'];
  if (!stage || !canvas) return [];

  const canvasRect = canvas.getBoundingClientRect();
  const out: Array<{ x: number; y: number }> = [];
  collectPixiInteractives(stage as Record<string, unknown>, canvasRect, out);
  return out;
}

type PixiObj = Record<string, unknown>;

function collectPixiInteractives(
  obj: PixiObj,
  canvasRect: DOMRect,
  out: Array<{ x: number; y: number }>,
): void {
  // Skip invisible branches entirely (saves traversal time)
  if (obj['visible'] === false) return;
  if (typeof obj['alpha'] === 'number' && (obj['alpha'] as number) <= 0) return;

  // Collect leaf-level interactive objects that show a pointer cursor.
  // Using cursor='pointer' rather than eventMode alone avoids collecting
  // large background panels or scroll containers.
  if (obj['eventMode'] === 'static' && obj['cursor'] === 'pointer') {
    try {
      // getBounds() returns bounds in canvas-local CSS pixels (Pixi v7 + v8)
      const bounds = (obj as { getBounds(): { x: number; y: number; width: number; height: number } }).getBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        const cx = bounds.x + bounds.width  / 2 + canvasRect.left;
        const cy = bounds.y + bounds.height / 2 + canvasRect.top;
        // Only include points within the visible viewport
        if (cx >= 0 && cx <= window.innerWidth && cy >= 0 && cy <= window.innerHeight) {
          out.push({ x: cx, y: cy });
        }
      }
    } catch {
      // getBounds() can throw for destroyed or unattached containers
    }
  }

  // Recurse into children
  const children = obj['children'];
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object') {
        collectPixiInteractives(child as PixiObj, canvasRect, out);
      }
    }
  }
}
