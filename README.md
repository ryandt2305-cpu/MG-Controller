# MG Controller

Xbox, PlayStation, Nintendo, and generic controller support for Magic Garden.

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open the [Tampermonkey] dashboard 
3. Drag and drop mg-controller.user.js` onto the dashboard, click Install.
4. Reload the game — press any button on your controller to activate it.

---

## Default Controls

Button names below use Xbox labels. Xbox, PlayStation, Nintendo, and most generic USB/Bluetooth controllers are all supported — the settings panel shows the correct button names for your controller automatically.

**Movement**
- Left stick — move character
- Right stick — move cursor
- **D-Pad — snap cursor to the nearest interactive element in that direction**

**Hotbar**
- **LB / RB — cycle hotbar slots (previous / next)**
- LB + RB — deselect the current hotbar slot

**Pet Slots**
- **LT / RT — cycle pet slots (previous / next)**

**Inventory & Actions**
- **Y — toggle inventory**
- A — primary action (interact / click)
- B — close / back
- X — rotate decor

**Other**
- L3 / R3 — zoom out / in
- Start — open controller settings

---

## Notes

**Primary Action smart behaviour** — if you've moved the cursor recently (right stick or D-pad), pressing A clicks whatever the cursor is over. If the cursor is hidden, A presses Space (the game's default interact key).

**LB / RB on multi-harvest plants** — when standing on a tile with multiple grow slots, LB and RB cycle through the grow slots instead of the hotbar. They go back to hotbar cycling as soon as you move off that tile.

**Pet slot cycling** — LT / RT cycle through your pet slots. The script discovers the game's internal state automatically in the background (~5 seconds after load). You'll see a confirmation in the browser console when it's ready.

**D-pad snap** — the D-pad snaps the cursor to the nearest interactive element in that direction, including inventory items, shop cards, menu buttons, and world objects. It works on top of any overlay mods (QPM-GR, AriesMod, etc.).

---

## Settings Panel

Press **Start / Options** to open the settings panel.

- **Cursor Speed** — choose Slow, Medium, or Fast.
- **Button Bindings** — click any action to rebind it. Press the button you want, or wait 5 seconds to cancel.
- **Unbound Actions** — actions with no button assigned (collapsed by default). Click to expand and bind them.
- **Reset to Defaults** — restores all bindings to the defaults listed above.

Your bindings and speed preference are saved automatically and persist across sessions.

---

## Building from source

```sh
npm install
npm run build     # outputs dist/mg-controller.user.js
npm run dev       # watch mode with source maps
```

Requires Node.js 18+.
