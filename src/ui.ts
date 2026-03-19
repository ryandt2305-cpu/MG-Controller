/**
 * Controller Settings panel — Shadow DOM for style isolation.
 *
 * Sections:
 *  - Cursor speed preset
 *  - Fixed Controls (sticks, D-pad, LB+RB chord)
 *  - Button Bindings (rebindable, sorted by button index)
 *  - Unbound Actions (rebindable, no current button)
 */

import type { Action } from './bindings';
import {
  ACTION_LABELS,
  DEFAULT_BINDINGS,
  saveBindings,
  saveCursorSpeed,
  type CursorSpeed,
} from './bindings';
import type { ControllerProfile } from './controller-profile';

type OnSpeedChange = (speed: CursorSpeed) => void;
type OnBindingsChange = (bindings: Record<number, Action>) => void;

// Actions that are context-sensitive on LB/RB (hotbar when normal, grow slots on multi-harvest)
const CONTEXT_SENSITIVE_ACTIONS = new Set<Action>(['prevHotbarSlot', 'nextHotbarSlot']);

// deselectSlot is always active via the LB+RB chord regardless of bindings
const CHORD_ONLY_ACTION: Action = 'deselectSlot';

export class SettingsPanel {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private panel: HTMLElement | null = null;
  private open = false;

  private bindings: Record<number, Action>;
  private currentSpeed: CursorSpeed;
  private currentProfile: ControllerProfile | null;
  private onSpeedChange: OnSpeedChange;
  private onBindingsChange: OnBindingsChange;

  private captureAbort: (() => void) | null = null;

  constructor(
    bindings: Record<number, Action>,
    currentSpeed: CursorSpeed,
    initialProfile: ControllerProfile | null,
    onSpeedChange: OnSpeedChange,
    onBindingsChange: OnBindingsChange,
  ) {
    this.bindings = { ...bindings };
    this.currentSpeed = currentSpeed;
    this.currentProfile = initialProfile;
    this.onSpeedChange = onSpeedChange;
    this.onBindingsChange = onBindingsChange;

    this.host = document.createElement('div');
    this.host.id = 'mg-controller-settings-host';
    this.shadow = this.host.attachShadow({ mode: 'open' });

    this.shadow.innerHTML = STYLES + TOGGLE_BTN_HTML;
    document.body.appendChild(this.host);

    this.shadow.getElementById('mg-ctrl-toggle')!.addEventListener('click', () => this.toggle());
  }

  toggle(): void {
    this.open ? this.close() : this.openPanel();
  }

  openPanel(): void {
    if (this.open) return;
    this.open = true;
    this.renderPanel();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.captureAbort?.();
    this.panel?.remove();
    this.panel = null;
  }

  setProfile(profile: ControllerProfile | null): void {
    this.currentProfile = profile;
    if (this.open) { this.panel?.remove(); this.renderPanel(); }
  }

  refreshBindings(bindings: Record<number, Action>): void {
    this.bindings = { ...bindings };
    if (this.open) { this.panel?.remove(); this.renderPanel(); }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private renderPanel(): void {
    this.panel?.remove();

    const panel = document.createElement('div');
    panel.id = 'mg-ctrl-panel';

    const badgeText    = this.currentProfile ? `${this.currentProfile.name} · Connected` : 'No controller';
    const badgeVariant = this.currentProfile ? 'connected' : 'none';

    panel.innerHTML = `
      <div class="mg-ctrl-header">
        <span class="mg-ctrl-title">🎮 Controller Settings</span>
        <span class="mg-ctrl-badge mg-ctrl-badge--${badgeVariant}">${badgeText}</span>
        <button id="mg-ctrl-close" aria-label="Close">✕</button>
      </div>

      <div class="mg-ctrl-section">
        <div class="mg-ctrl-section-label">Cursor Speed</div>
        <div class="mg-ctrl-speed-row">
          ${(['slow', 'medium', 'fast'] as CursorSpeed[]).map((s) => `
            <button class="mg-ctrl-speed-btn${s === this.currentSpeed ? ' active' : ''}"
                    data-speed="${s}">${capitalize(s)}</button>
          `).join('')}
        </div>
      </div>

      ${this.renderFixed()}
      ${this.renderBindings()}

      <div class="mg-ctrl-footer">
        <button id="mg-ctrl-reset">Reset to Defaults</button>
      </div>
    `;

    this.shadow.appendChild(panel);
    this.panel = panel;

    panel.querySelector<HTMLElement>('#mg-ctrl-close')!
      .addEventListener('click', () => this.close());

    panel.querySelectorAll<HTMLElement>('.mg-ctrl-speed-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = btn.dataset['speed'] as CursorSpeed;
        this.currentSpeed = speed;
        saveCursorSpeed(speed);
        this.onSpeedChange(speed);
        panel.querySelectorAll('.mg-ctrl-speed-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    panel.querySelectorAll<HTMLElement>('[data-action]').forEach((cell) => {
      cell.addEventListener('click', () => {
        this.startCapture(cell.dataset['action'] as Action, cell);
      });
    });

    const unboundToggle = panel.querySelector<HTMLElement>('#mg-ctrl-unbound-toggle');
    const unboundBody   = panel.querySelector<HTMLElement>('#mg-ctrl-unbound-body');
    if (unboundToggle && unboundBody) {
      unboundToggle.addEventListener('click', () => {
        const expanded = unboundBody.style.display !== 'none';
        unboundBody.style.display = expanded ? 'none' : '';
        unboundToggle.textContent  = expanded ? 'Show ▾' : 'Hide ▴';
        unboundToggle.setAttribute('aria-expanded', String(!expanded));
      });
    }

    panel.querySelector<HTMLElement>('#mg-ctrl-reset')!.addEventListener('click', () => {
      this.captureAbort?.();
      this.bindings = { ...DEFAULT_BINDINGS };
      saveBindings(this.bindings);
      this.onBindingsChange(this.bindings);
      this.panel?.remove();
      this.renderPanel();
    });
  }

  // ---------------------------------------------------------------------------
  // Section: Fixed Controls
  // ---------------------------------------------------------------------------

  private renderFixed(): string {
    const lb = this.btnLabel(4);
    const rb = this.btnLabel(5);

    return `
      <div class="mg-ctrl-section">
        <div class="mg-ctrl-section-label">Fixed Controls</div>
        <table class="mg-ctrl-table">
          <tbody>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">Left Stick</span></td>
              <td class="mg-ctrl-desc-col">Move character</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">Right Stick</span></td>
              <td class="mg-ctrl-desc-col">Move cursor</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">D-Pad</span></td>
              <td class="mg-ctrl-desc-col">Snap cursor to nearest</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col">
                ${this.pill(lb)}
                <span class="mg-ctrl-chord-plus">+</span>
                ${this.pill(rb)}
              </td>
              <td class="mg-ctrl-desc-col">Deselect hotbar slot</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Section: Button Bindings + Unbound Actions
  // ---------------------------------------------------------------------------

  private renderBindings(): string {
    const warnBanner = (this.currentProfile !== null && !this.currentProfile.isStandard)
      ? `<div class="mg-ctrl-warn">⚠ Non-standard controller — button numbers may vary</div>`
      : '';

    // Build sorted list of [buttonIndex, action] by index ascending
    const boundEntries: Array<[number, Action]> = (Object.entries(this.bindings)
      .map(([k, v]) => [parseInt(k, 10), v as Action] as [number, Action]))
      .sort((a, b) => a[0] - b[0]);

    const boundActionSet = new Set(boundEntries.map(([, a]) => a));

    // Unbound: every action in ACTION_LABELS that has no button assigned
    const unboundActions = (Object.keys(ACTION_LABELS) as Action[])
      .filter((a) => !boundActionSet.has(a));

    const hasContextNote = boundEntries.some(([, a]) => CONTEXT_SENSITIVE_ACTIONS.has(a));

    // Bound rows
    const boundRows = boundEntries.map(([btnIdx, action]) => {
      const label   = ACTION_LABELS[action];
      const ctxMark = CONTEXT_SENSITIVE_ACTIONS.has(action)
        ? `<span class="mg-ctrl-ctx-marker" title="Context-sensitive">†</span>`
        : '';
      return `
        <tr>
          <td class="mg-ctrl-input-col">${this.pill(this.btnLabel(btnIdx))}</td>
          <td class="mg-ctrl-action-cell" data-action="${action}">${label}${ctxMark}</td>
        </tr>
      `;
    }).join('');

    const contextFootnote = hasContextNote
      ? `<div class="mg-ctrl-footnote">† On multi-harvest plants, LB/RB cycle grow slots instead of hotbar</div>`
      : '';

    // Unbound rows
    const unboundRows = unboundActions.map((action) => {
      const label       = ACTION_LABELS[action];
      const isChordAlso = action === CHORD_ONLY_ACTION;
      const subNote     = isChordAlso
        ? `<span class="mg-ctrl-subnote">Also active as ${this.btnLabel(4)} + ${this.btnLabel(5)} chord</span>`
        : '';
      return `
        <tr>
          <td class="mg-ctrl-input-col">${this.pill('—', true)}</td>
          <td class="mg-ctrl-action-cell mg-ctrl-action-unbound" data-action="${action}">
            ${label}${subNote}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="mg-ctrl-section">
        ${warnBanner}
        <div class="mg-ctrl-section-header">
          <span class="mg-ctrl-section-label">Button Bindings</span>
          <span class="mg-ctrl-hint">Click an action to rebind</span>
        </div>
        <table class="mg-ctrl-table">
          <tbody>${boundRows}</tbody>
        </table>
        ${contextFootnote}
        ${unboundRows ? `
          <div class="mg-ctrl-section-header mg-ctrl-section-header--sub">
            <span class="mg-ctrl-section-label mg-ctrl-section-label--dim">Unbound</span>
            <button class="mg-ctrl-collapse-btn" id="mg-ctrl-unbound-toggle" aria-expanded="false">Show ▾</button>
          </div>
          <div id="mg-ctrl-unbound-body" style="display:none">
            <table class="mg-ctrl-table">
              <tbody>${unboundRows}</tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private btnLabel(index: number): string {
    return this.currentProfile?.buttonLabels[index] ?? `Btn ${index}`;
  }

  /** Render a button pill chip. `unbound` renders the dimmed "—" variant. */
  private pill(label: string, unbound = false): string {
    return `<span class="mg-ctrl-pill${unbound ? ' mg-ctrl-pill--unbound' : ''}">${label}</span>`;
  }

  // ---------------------------------------------------------------------------
  // Rebind capture
  // ---------------------------------------------------------------------------

  private startCapture(action: Action, cell: HTMLElement): void {
    this.captureAbort?.();

    const originalHTML = cell.innerHTML;
    cell.textContent = 'Press a button…';
    cell.classList.add('capturing');

    let pollId: ReturnType<typeof setInterval> | null = null;
    let aborted = false;

    const abort = (): void => {
      if (aborted) return;
      aborted = true;
      if (pollId !== null) clearInterval(pollId);
      cell.innerHTML = originalHTML;
      cell.classList.remove('capturing');
      this.captureAbort = null;
    };

    this.captureAbort = abort;

    const snapshot: Map<number, boolean> = new Map();
    for (const gp of navigator.getGamepads()) {
      if (!gp) continue;
      gp.buttons.forEach((btn, i) => snapshot.set(i, btn.pressed));
      break;
    }

    pollId = setInterval(() => {
      for (const gp of navigator.getGamepads()) {
        if (!gp) continue;
        gp.buttons.forEach((btn, i) => {
          if (btn.pressed && !(snapshot.get(i) ?? false) && !aborted) {
            clearInterval(pollId!);
            this.applyRebind(action, i, cell);
            aborted = true;
            this.captureAbort = null;
          }
        });
        break;
      }
    }, 50);

    setTimeout(() => { if (!aborted) abort(); }, 5_000);
  }

  private applyRebind(action: Action, newIndex: number, cell: HTMLElement): void {
    // Remove existing mapping for this action
    for (const [btnIdx, act] of Object.entries(this.bindings)) {
      if (act === action) { delete this.bindings[parseInt(btnIdx, 10)]; break; }
    }
    // Displace whatever was on the new button
    delete this.bindings[newIndex];
    this.bindings[newIndex] = action;

    cell.classList.remove('capturing');
    saveBindings(this.bindings);
    this.onBindingsChange(this.bindings);
    this.panel?.remove();
    this.renderPanel();
  }

  destroy(): void {
    this.captureAbort?.();
    this.host.remove();
  }
}

// ---------------------------------------------------------------------------
// Templates & styles
// ---------------------------------------------------------------------------

const TOGGLE_BTN_HTML = `<button id="mg-ctrl-toggle" title="Controller Settings">🎮</button>`;

const STYLES = `
<style>
  :host {
    all: initial;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483646;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e0e0e0;
  }

  /* ── Toggle button ── */
  #mg-ctrl-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(10,10,18,0.85);
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
    backdrop-filter: blur(4px);
  }

  /* ── Panel ── */
  #mg-ctrl-panel {
    position: fixed;
    bottom: 70px;
    right: 20px;
    width: 340px;
    max-height: 76vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: rgba(14, 14, 22, 0.97);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }

  /* ── Header ── */
  .mg-ctrl-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: sticky;
    top: 0;
    background: rgba(14,14,22,0.97);
    z-index: 1;
  }
  .mg-ctrl-title {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
    white-space: nowrap;
  }
  #mg-ctrl-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 15px;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  #mg-ctrl-close:hover { color: #ccc; }

  /* ── Badge ── */
  .mg-ctrl-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .mg-ctrl-badge--connected {
    background: rgba(60,200,100,0.15);
    border: 1px solid rgba(60,200,100,0.35);
    color: #70e090;
  }
  .mg-ctrl-badge--none {
    background: rgba(120,120,120,0.12);
    border: 1px solid rgba(120,120,120,0.2);
    color: #777;
  }

  /* ── Sections ── */
  /* All horizontal padding lives here — avoids specificity fights on child elements */
  .mg-ctrl-section {
    padding: 12px 16px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mg-ctrl-section:last-child { border-bottom: none; }

  .mg-ctrl-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
    padding-bottom: 8px;
  }
  .mg-ctrl-section-label--dim { color: #444; }

  .mg-ctrl-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .mg-ctrl-section-header--sub {
    margin-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 10px;
  }

  .mg-ctrl-hint {
    font-size: 11px;
    color: #444;
    font-style: italic;
  }

  .mg-ctrl-collapse-btn {
    background: none;
    border: none;
    color: #484848;
    font-size: 11px;
    font-style: italic;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .mg-ctrl-collapse-btn:hover { color: #777; }

  /* ── Cursor speed ── */
  .mg-ctrl-speed-row {
    display: flex;
    gap: 6px;
    padding-bottom: 8px;
  }
  .mg-ctrl-speed-btn {
    flex: 1;
    padding: 5px 4px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: #888;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .mg-ctrl-speed-btn:hover { background: rgba(255,255,255,0.08); color: #bbb; }
  .mg-ctrl-speed-btn.active {
    background: rgba(90,150,255,0.22);
    border-color: rgba(90,150,255,0.5);
    color: #c0d8ff;
  }

  /* ── Table ── */
  .mg-ctrl-table {
    width: 100%;
    border-collapse: collapse;
  }
  .mg-ctrl-table tr:hover td { background: rgba(255,255,255,0.03); }
  .mg-ctrl-table td {
    padding: 5px 8px 5px 0;
    vertical-align: middle;
  }

  /* Input column — button pills / control names */
  .mg-ctrl-input-col {
    padding-left: 16px;
    width: 1%;            /* shrink to content */
    white-space: nowrap;
  }
  .mg-ctrl-desc-col {
    padding-right: 16px;
    color: #666;
    font-size: 12px;
  }

  /* Plain text input labels (Left Stick / D-Pad etc.) */
  .mg-ctrl-input-text {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  /* ── Button pill ── */
  .mg-ctrl-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.09);
    font-size: 12px;
    font-weight: 500;
    color: #d8d8d8;
    white-space: nowrap;
    line-height: 1.5;
    vertical-align: middle;
  }
  .mg-ctrl-pill--unbound {
    border-color: rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #444;
  }
  .mg-ctrl-chord-plus {
    font-size: 11px;
    color: #555;
    margin: 0 3px;
    vertical-align: middle;
  }

  /* ── Action cell (rebindable) ── */
  .mg-ctrl-action-cell {
    cursor: pointer;
    color: #8ab4f8;
    padding-right: 16px;
    font-size: 13px;
    transition: color 0.15s;
  }
  .mg-ctrl-action-cell:hover { color: #b8d0ff; }
  .mg-ctrl-action-cell.capturing {
    color: #f0a040;
    font-style: italic;
    cursor: default;
  }
  .mg-ctrl-action-unbound .mg-ctrl-action-cell,
  .mg-ctrl-action-cell.mg-ctrl-action-unbound {
    color: #555;
  }
  .mg-ctrl-action-cell.mg-ctrl-action-unbound:hover { color: #7a9acc; }

  /* ── Context-sensitive marker ── */
  .mg-ctrl-ctx-marker {
    font-size: 10px;
    color: #666;
    margin-left: 4px;
    vertical-align: super;
    line-height: 0;
  }

  /* ── Sub-note (chord note under unbound deselectSlot) ── */
  .mg-ctrl-subnote {
    display: block;
    font-size: 11px;
    color: #444;
    font-style: italic;
    margin-top: 1px;
  }

  /* ── Footnote ── */
  .mg-ctrl-footnote {
    font-size: 11px;
    color: #484848;
    font-style: italic;
    padding: 4px 0 8px;
  }

  /* ── Non-standard controller warning ── */
  .mg-ctrl-warn {
    margin-bottom: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255,160,50,0.1);
    border: 1px solid rgba(255,160,50,0.2);
    color: #c8882a;
    font-size: 11px;
  }

  /* ── Footer ── */
  .mg-ctrl-footer {
    padding: 10px 16px 14px;
    display: flex;
    justify-content: flex-end;
  }
  #mg-ctrl-reset {
    background: rgba(220,60,60,0.12);
    border: 1px solid rgba(220,60,60,0.28);
    color: #cc7070;
    padding: 5px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;
  }
  #mg-ctrl-reset:hover { background: rgba(220,60,60,0.22); }
</style>
`;

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
