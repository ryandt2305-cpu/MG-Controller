/**
 * Action definitions, default bindings, and GM_* persistence.
 *
 * Rebindable actions map a gamepad button index to an Action string.
 * Hardcoded actions (Move, Start→Settings) are not stored here.
 */

// ---------------------------------------------------------------------------
// Action type
// ---------------------------------------------------------------------------

export type Action =
  | 'primaryAction'      // Space (or cursor click when cursor visible)
  | 'back'               // Escape
  | 'inventory'          // E
  | 'rotateDecor'        // R
  | 'prevHotbarSlot'     // cycles hotbar 1-9 backwards
  | 'nextHotbarSlot'     // cycles hotbar 1-9 forwards
  | 'prevPetSlot'        // Jotai write
  | 'nextPetSlot'        // Jotai write
  | 'zoomIn'             // = key
  | 'zoomOut'            // - key
  | 'cursorClick'        // synthetic pointer click at cursor position
  | 'openSettings'       // open controller settings panel
  | 'deselectSlot'       // re-press active hotbar slot (LB+RB chord)
  | 'nextGrowSlot'       // C key — next grow slot on multi-harvest plants
  | 'prevGrowSlot';      // X key — prev grow slot on multi-harvest plants

// ---------------------------------------------------------------------------
// Human-readable names and descriptions
// ---------------------------------------------------------------------------

export const ACTION_LABELS: Record<Action, string> = {
  primaryAction: 'Primary Action',
  back: 'Close / Back',
  inventory: 'Toggle Inventory',
  rotateDecor: 'Rotate Decor',
  prevHotbarSlot: 'Prev Hotbar / Grow Slot',
  nextHotbarSlot: 'Next Hotbar / Grow Slot',
  prevPetSlot: 'Prev Pet Slot',
  nextPetSlot: 'Next Pet Slot',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  cursorClick: 'Cursor Click',
  openSettings: 'Controller Settings',
  deselectSlot: 'Deselect Hotbar Slot',
  nextGrowSlot: 'Next Grow Slot (dedicated)',
  prevGrowSlot: 'Prev Grow Slot (dedicated)',
};

// ---------------------------------------------------------------------------
// Default bindings: button index → Action
// ---------------------------------------------------------------------------

// NOTE: movement (D-Pad, Left Stick) and Settings (Start/9) are hardcoded.
export const DEFAULT_BINDINGS: Record<number, Action> = {
  0: 'primaryAction',    // A / ×
  1: 'back',             // B / ○
  2: 'rotateDecor',      // X / □
  3: 'inventory',        // Y / △
  4: 'prevHotbarSlot',   // LB
  5: 'nextHotbarSlot',   // RB
  6: 'prevPetSlot',      // LT
  7: 'nextPetSlot',      // RT
  9: 'openSettings',     // Start
  10: 'zoomOut',         // L3
  11: 'zoomIn',          // R3
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gemini:controller:bindings';

export function loadBindings(): Record<number, Action> {
  try {
    const raw = GM_getValue(STORAGE_KEY, null) as string | null;
    if (!raw) return { ...DEFAULT_BINDINGS };
    const parsed = JSON.parse(raw) as Record<string, string>;
    const result: Record<number, Action> = { ...DEFAULT_BINDINGS };
    for (const [key, value] of Object.entries(parsed)) {
      const index = parseInt(key, 10);
      if (!isNaN(index) && isValidAction(value)) {
        result[index] = value;
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
}

export function saveBindings(bindings: Record<number, Action>): void {
  try {
    GM_setValue(STORAGE_KEY, JSON.stringify(bindings));
  } catch (err) {
    console.warn('[MG-Controller] Failed to save bindings:', err);
  }
}

const VALID_ACTIONS = new Set<string>(Object.keys(ACTION_LABELS));

function isValidAction(value: string): value is Action {
  return VALID_ACTIONS.has(value);
}

// ---------------------------------------------------------------------------
// Cursor speed presets
// ---------------------------------------------------------------------------

export type CursorSpeed = 'slow' | 'medium' | 'fast';

const SPEED_STORAGE_KEY = 'gemini:controller:cursorSpeed';

export const CURSOR_SPEED_VALUES: Record<CursorSpeed, number> = {
  slow: 400,
  medium: 700,
  fast: 1100,
};

export function loadCursorSpeed(): CursorSpeed {
  const raw = GM_getValue(SPEED_STORAGE_KEY, 'medium') as string;
  if (raw === 'slow' || raw === 'medium' || raw === 'fast') return raw;
  return 'medium';
}

export function saveCursorSpeed(speed: CursorSpeed): void {
  try {
    GM_setValue(SPEED_STORAGE_KEY, speed);
  } catch (err) {
    console.warn('[MG-Controller] Failed to save cursor speed:', err);
  }
}
