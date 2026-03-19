// ==UserScript==
// @name         MG Controller
// @namespace    https://magicgarden.gg
// @version      1.0.0
// @description  Full controller (Xbox/PS) support for Magic Garden
// @author       you
// @match        *://magicgarden.gg/r/*
// @match        *://magiccircle.gg/r/*
// @match        *://starweaver.org/r/*
// @match        *://*.discordsays.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

import { initPetSlotAtoms, cyclePetSlot, isGrowSlotContextActive } from './context';
import {
  loadBindings,
  loadCursorSpeed,
  CURSOR_SPEED_VALUES,
  type Action,
  type CursorSpeed,
} from './bindings';
import { tapKey, cycleHotbar, deselectHotbarSlot } from './synthesis';
import { Cursor } from './cursor';
import { GamepadPoller } from './gamepad';
import { SettingsPanel } from './ui';
import { detectProfile, type ControllerProfile } from './controller-profile';

// ---------------------------------------------------------------------------
// These are set during main() so handleAction can reference them without
// circular module dependencies.
// ---------------------------------------------------------------------------

let cursorRef: import('./cursor').Cursor | null = null;
let openSettingsFn: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Action handler — called by GamepadPoller on rising-edge button press
// ---------------------------------------------------------------------------

async function handleAction(action: Action): Promise<void> {
  switch (action) {
    case 'primaryAction': {
      // Cursor click when cursor is visible (right stick recently used),
      // Space otherwise. This is more reliable than async modal detection.
      if (cursorRef?.isVisible()) {
        cursorRef.click();
      } else {
        tapKey(' ');
      }
      break;
    }

    case 'back':
      tapKey('Escape');
      break;

    case 'inventory':
      tapKey('e');
      break;

    case 'rotateDecor':
      // Always fires R; game ignores it when not in decor placement mode
      tapKey('r');
      break;

    case 'prevHotbarSlot':
      // On a multi-harvest tile: cycle grow slots (X key); otherwise cycle hotbar
      isGrowSlotContextActive() ? tapKey('x') : cycleHotbar('prev');
      break;

    case 'nextHotbarSlot':
      // On a multi-harvest tile: cycle grow slots (C key); otherwise cycle hotbar
      isGrowSlotContextActive() ? tapKey('c') : cycleHotbar('next');
      break;

    case 'prevPetSlot':
      await cyclePetSlot('prev');
      break;

    case 'nextPetSlot':
      await cyclePetSlot('next');
      break;

    case 'zoomIn':
      tapKey('=');
      break;

    case 'zoomOut':
      tapKey('-');
      break;

    case 'cursorClick':
      cursorRef?.click();
      break;

    case 'openSettings':
      openSettingsFn?.();
      break;

    case 'deselectSlot':
      deselectHotbarSlot();
      break;

    case 'nextGrowSlot':
      tapKey('c');
      break;

    case 'prevGrowSlot':
      tapKey('x');
      break;
  }
}

// ---------------------------------------------------------------------------
// Detect the initial controller profile (for gamepads already connected
// before the script ran — common when the page reloads with controller held).
// ---------------------------------------------------------------------------

function getInitialProfile(): ControllerProfile | null {
  if (!('getGamepads' in navigator)) return null;
  for (const gp of navigator.getGamepads()) {
    if (gp) return detectProfile(gp);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[MG-Controller] Booting…');

  // Kick off atom discovery early (fire-and-forget).
  // Resolves when pet slot atoms are found (enables RT/LT cycling)
  // and subscribes activeModalAtom for sync modal checks (enables D-pad snap).
  void initPetSlotAtoms();

  const bindings = loadBindings();
  const speedPreset = loadCursorSpeed();
  const cursor = new Cursor(CURSOR_SPEED_VALUES[speedPreset]);
  cursorRef = cursor;

  const initialProfile = getInitialProfile();

  const panel = new SettingsPanel(
    bindings,
    speedPreset,
    initialProfile,
    (speed: CursorSpeed) => {
      cursor.setSpeed(CURSOR_SPEED_VALUES[speed]);
    },
    (newBindings: Record<number, Action>) => {
      poller.updateBindings(newBindings);
    },
  );

  openSettingsFn = () => panel.toggle();

  const poller = new GamepadPoller(
    bindings,
    cursor,
    handleAction,
    (profile) => panel.setProfile(profile),
  );
  poller.start();

  // Expose destroy for development hot-reload
  (window as unknown as Record<string, unknown>)['__mgController'] = {
    destroy(): void {
      poller.stop();
      cursor.destroy();
      panel.destroy();
      cursorRef = null;
      delete (window as unknown as Record<string, unknown>)['__mgController'];
      console.log('[MG-Controller] Destroyed.');
    },
  };

  console.log('[MG-Controller] Ready. Press Start / Options to open settings.');
}

void main();
