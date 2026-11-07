# Mobile Touch Experience (WordPress Plugin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WordPress plugin studio's canvas and selected-item inspector reliably touch-friendly without changing desktop behavior.

**Architecture:** The plugin's vanilla-JS engine already tracks a `Map` of active pointers and computes pinch from finger distance. We harden that path (capture every pointer, cancel drags on pinch, ignore leftover fingers) and add plugin-rendered zoom buttons plus mobile-sized inspector controls. All behavior changes are gated by the existing plugin mobile breakpoint (`max-width: 768px` / short landscape); desktop markup and logic stay intact.

**Tech Stack:** Vanilla ES5-style JavaScript (`studio-app.js`), plain CSS (`studio.css`), PHP-rendered markup (`wp-studio.php`), static test harness (`test-page.html`), Three.js (local).

**Spec:** `docs/phase-2-mobile-touch-design.md`

## Global Constraints

- Scope is `wordpress-plugin/chekadbam-studio/` only. Do **not** change `src/` (Next.js) in this plan.
- No new dependencies, no build step, no framework. Match the file's existing `var` / `function` style and Persian comments where the surrounding code uses them.
- All UI copy stays Persian and RTL.
- Mobile breakpoint is exactly the existing one: `@media (max-width: 768px), (max-height: 480px) and (orientation: landscape)`.
- Desktop (`> 768px` wide and not short-landscape) must look and behave as before: compact inspector, no zoom buttons, no `−۴۵°` button.
- Touch targets: every inspector button ≥ 44×44 CSS px; every color swatch ≥ 32×32 CSS px.
- Use existing helpers `animateRadiusTo`, `moveItemVisual`, `hintSignal`, `selectItem`, `updateInspectorMeta`, `rootEl`, `--ckb-dock-h`, `env(safe-area-inset-bottom)`. Do not duplicate zoom or layout math.
- Radius clamp everywhere: `[4, max(space.width, space.length) * 3]`.
- `node --check wordpress-plugin/chekadbam-studio/assets/studio-app.js` must pass after every JS change.
- Do not rename existing IDs (`btn-rot45`, `btn-rot90`, `insp`, `insp-colors`, …); other code and the tour rely on them.

## Review Focus

- Pinch starting while an item is mid-drag must snap the item back to its committed `x/z` and commit nothing.
- Lifting one finger after a pinch must not orbit the camera with a stale delta.
- A third finger, `pointercancel`, or a finger leaving the canvas must not leave the camera locked or a ghost drag behind.
- At 320–360px wide, 44px inspector controls must remain reachable and colors must scroll instead of pushing actions off-panel.
- At 800px, zoom controls and `−۴۵°` must be hidden and the inspector must remain the compact desktop bar.

---

### Task 1: Harden multi-pointer pinch arbitration

**Files:**
- Modify: `wordpress-plugin/chekadbam-studio/assets/studio-app.js` (state ~916–931, pointer handlers ~1059–1230, public API ~2664–2683)
- Modify: `wordpress-plugin/chekadbam-studio/test-page.html:370`

**Interfaces:**
- Consumes: `moveItemVisual(item)`, `items`, `selectedId`, `cameraAngle`, `rootEl`, `MOBILE`, `updateInspectorMeta()`.
- Produces:
  - `var DRAG_THRESHOLD = MOBILE ? 10 : 6;`
  - `var ignorePointersUntilClear = false;` (true from pinch start until every pointer is released)
  - Public API additions: `selectItem(id)`, `getState()` returning:
    ```js
    {
      camera: { theta, phi, radius },
      space: { width, length },
      selectedId,
      selectedItem: { id, x, z, rotation, wpcColor } | null,
      items: [{ id, x, z, rotation, groupX, groupZ }]
    }
    ```
  - `window.__studio` in `test-page.html` holds the object returned by `CKBStudio.mount`.

- [ ] **Step 1: Add gesture state and threshold**

In `studio-app.js` next to `activePointers` / `pinch`, add:

```js
/* Touch drags need more slop than a mouse press */
var DRAG_THRESHOLD = MOBILE ? 10 : 6;
/* Set on pinch start; cleared only when every finger has lifted */
var ignorePointersUntilClear = false;
```

Change `pinchDist()` to return `0` when fewer than two pointers are tracked.

- [ ] **Step 2: Rewrite the `pointerdown` branch**

Immediately after `activePointers.set(...)`, capture the pointer once:

```js
try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
```

Then handle multi-touch before the single-pointer selection path:

- If `activePointers.size >= 2`:
  - only on the `1 → 2` transition, create `pinch = { startDist: pinchDist(), startRadius: cameraAngle.radius }`;
  - if `isDragging` and `selectedId`, look up the item and call `moveItemVisual(item)` to snap the live group/proxy back to committed `item.x/z`;
  - clear `isDragging`, `isOrbiting`, `clickedId`, `dragLast`; remove `ckb-dragging`; set `hasMoved = true`; set `ignorePointersUntilClear = true`;
  - `return` for every pointer from the second onward (third/fourth fingers only stay tracked).
- Otherwise run the existing single-pointer pick/select/drag-offset logic unchanged.
- Remove the old late `setPointerCapture` at the end of the single-pointer branch.

- [ ] **Step 3: Guard `pointermove`**

Order of checks:

1. Update the tracked position if present.
2. If `pinch && activePointers.size >= 2`, apply the existing ratio zoom and `return`.
3. If `ignorePointersUntilClear`, `return`.
4. Continue with the existing drag / orbit / hover logic, replacing the hard-coded `6` in the movement check with `DRAG_THRESHOLD`.

- [ ] **Step 4: Rewrite `pointerup` and `pointercancel` cleanup**

For both events, delete the pointer and attempt `releasePointerCapture`.

- `pointerup`:
  - if `activePointers.size >= 2`, `return`;
  - if `pinch`, set `pinch = null`;
  - if `ignorePointersUntilClear`:
    - if pointers remain, `return` (ignore the leftover finger);
    - otherwise clear `ignorePointersUntilClear` and reset `isOrbiting`, `isDragging`, `clickedId`, `dragLast`, and `ckb-dragging`, then `return` (no selection);
  - else run the existing drag-commit / orbit-hint / tap-select logic unchanged.
- `pointercancel`:
  - if `activePointers.size < 2`, `pinch = null`;
  - if `isDragging` and `clickedId`, restore the item's group/proxy to committed `item.x/z` with `moveItemVisual` and **do not** push history or commit `dragLast`;
  - if pointers remain, set `ignorePointersUntilClear = true` and `return`;
  - otherwise clear `ignorePointersUntilClear` and reset all gesture flags + `ckb-dragging`.

- [ ] **Step 5: Add test/debug API and store it in the test page**

In the returned public object add:

```js
selectItem: function (id) { selectItem(id); },
getState: function () { /* shape above, reading itemGroups for groupX/groupZ and `space` for width/length */ },
```

In `test-page.html`, replace `window.CKBStudio.mount(...)` with `window.__studio = window.CKBStudio.mount(...)`.

- [ ] **Step 6: Syntax check**

Run: `node --check wordpress-plugin/chekadbam-studio/assets/studio-app.js`
Expected: no output, exit code 0.

- [ ] **Step 7: Verify pinch and leftover-finger behavior in the browser**

Serve the plugin folder: `cd wordpress-plugin; python -m http.server 8899`.
Open `http://localhost:8899/chekadbam-studio/test-page.html` at 390px wide, then run in the page console:

```js
const s = window.__studio;
const canvas = document.querySelector('#ckb-ws-test canvas');
const ev = (type, id, x, y, buttons = 1) => canvas.dispatchEvent(new PointerEvent(type, {
  pointerId: id, clientX: x, clientY: y, buttons,
  pointerType: 'touch', bubbles: true, cancelable: true
}));
s.selectItem(null);
const before = s.getState();
ev('pointerdown', 1, 120, 320);
ev('pointerdown', 2, 240, 320);
ev('pointermove', 1, 100, 320);
ev('pointermove', 2, 260, 320);
const zoomed = s.getState();        // zoomed.camera.radius < before.camera.radius
ev('pointerup', 2, 260, 320, 0);
ev('pointermove', 1, 330, 330);     // must be ignored
const after = s.getState();         // after.camera.theta === zoomed.camera.theta
ev('pointerup', 1, 330, 330, 0);
({ before, zoomed, after, selected: s.getState().selectedId })
```

Expected: `zoomed.camera.radius < before.camera.radius`, `after.camera.theta === zoomed.camera.theta`, `after.camera.phi === zoomed.camera.phi`, `selected === null`.

- [ ] **Step 8: Verify drag-cancel on pinch start**

With an item selected (`s.selectItem(s.getState().items[0].id)`), drag it with the mouse (browser automation), then while the mouse is still down dispatch a second touch pointer:

```js
document.querySelector('#ckb-ws-test canvas').dispatchEvent(new PointerEvent('pointerdown', {
  pointerId: 99, clientX: 60, clientY: 120, buttons: 1,
  pointerType: 'touch', bubbles: true, cancelable: true
}));
```

Expected: `s.getState().selectedItem.x/z` still equal the committed values, and the matching `items[i].groupX/groupZ` equal the same values (no visual offset). Release both pointers; no new history entry is committed.

- [ ] **Step 9: Verify third finger and `pointercancel` cleanup**

On a fresh page at 390px:

```js
const s = window.__studio;
const canvas = document.querySelector('#ckb-ws-test canvas');
const ev = (type, id, x, y, buttons = 1) => canvas.dispatchEvent(new PointerEvent(type, {
  pointerId: id, clientX: x, clientY: y, buttons,
  pointerType: 'touch', bubbles: true, cancelable: true
}));
// Third finger during a pinch must not reset the pinch or pick an item
ev('pointerdown', 1, 120, 320);
ev('pointerdown', 2, 240, 320);
const r0 = s.getState().camera.radius;
ev('pointerdown', 3, 180, 380);
ev('pointermove', 1, 100, 320);
ev('pointermove', 2, 260, 320);
const r1 = s.getState().camera.radius;   // still driven by fingers 1 + 2
ev('pointercancel', 1, 100, 320, 0);
ev('pointercancel', 2, 260, 320, 0);
ev('pointercancel', 3, 180, 380, 0);
// Cancel must not lock the camera: a fresh pinch still works
ev('pointerdown', 4, 120, 320);
ev('pointerdown', 5, 240, 320);
ev('pointermove', 4, 100, 320);
ev('pointermove', 5, 260, 320);
const r2 = s.getState().camera.radius;
ev('pointerup', 4, 100, 320, 0);
ev('pointerup', 5, 260, 320, 0);
({ r0, r1, r2, thirdFingerIgnored: r1 < r0, stillWorksAfterCancel: r2 < r1, selected: s.getState().selectedId })
```

Expected: `r1 < r0` (pinch still active with the third finger down), `r2 < r1` (camera not locked after cancel), `selected === null`.

- [ ] **Step 10: Commit**

```bash
git add wordpress-plugin/chekadbam-studio/assets/studio-app.js wordpress-plugin/chekadbam-studio/test-page.html
git commit -m "fix(studio): harden multi-touch pinch and drag cancellation"
```

---

### Task 2: Mobile inspector touch targets and ±45° rotation

**Files:**
- Modify: `wordpress-plugin/chekadbam-studio/assets/studio.css` (base inspector ~254–281, extras ~446–501, mobile block ~1326–1353)
- Modify: `wordpress-plugin/chekadbam-studio/includes/wp-studio.php:670–688`
- Modify: `wordpress-plugin/chekadbam-studio/test-page.html:39–56`
- Modify: `wordpress-plugin/chekadbam-studio/assets/studio-app.js` (`selectItem` ~733–754, bindings ~2311–2315, `buildInspSwatches` ~2624–2630, `updateInspectorMeta` ~761–775)

**Interfaces:**
- Consumes: existing `rotateSelected(deg)`, `updateInspectorMeta()`, `selectItem(id)`, root class list.
- Produces:
  - Button id `btn-rot-45` in both markup files, bound to `rotateSelected(-45)`.
  - CSS class `.ckb-insp-rot-neg` visible only inside the mobile media block.
  - Root class `ckb-inspector-open` toggled by `selectItem` (consumed by Task 3).

- [ ] **Step 1: Add the mobile-only −45° button to both markup files**

In `wp-studio.php` before the existing `btn-rot45`:

```php
<button type="button" class="ckb-insp-rot-neg" id="<?php echo esc_attr( $studio_id ); ?>-btn-rot-45" title="چرخش ۴۵ درجه به چپ" aria-label="چرخش ۴۵ درجه به چپ">−۴۵°</button>
```

Add the same element in `test-page.html` with id `ckb-ws-test-btn-rot-45`, placed before the `btn-rot45` line.

Also add missing Persian `aria-label`s to the existing rotate/delete/close buttons in both files (`چرخش ۴۵ درجه`, `چرخش ۹۰ درجه`, `حذف قلم`, `بستن و لغو انتخاب`).

- [ ] **Step 2: Bind and expose the new button**

In `studio-app.js` next to the other bindings:

```js
bindClick('btn-rot-45', function () { rotateSelected(-45); });
```

- [ ] **Step 3: Toggle the root class in `selectItem`**

When the inspector becomes visible (`insp.style.display = 'flex'`), add `rootEl.classList.add('ckb-inspector-open')`. On every path that hides it, call `rootEl.classList.remove('ckb-inspector-open')`.

- [ ] **Step 4: Add `aria-pressed` to color swatches**

In `buildInspSwatches`, add `aria-pressed="false"` to each emitted button. In `updateInspectorMeta`, set `aria-pressed` to `'true'` / `'false'` alongside the existing `.on` class toggle.

- [ ] **Step 5: Style the mobile panel and hide the new button on desktop**

Base CSS (outside the media query), next to the inspector rules:

```css
.ckb-wstudio-inspector .ckb-insp-rot-neg { display: none; }
```

Inside the existing mobile media block, replace the compact inspector rules with:

```css
.ckb-wstudio-inspector {
  bottom: calc(var(--ckb-dock-h, 56px) + env(safe-area-inset-bottom, 0px) + 10px);
  left: 8px;
  right: 8px;
  transform: none;
  justify-content: center;
  flex-wrap: wrap;
  overflow-y: auto;
  overscroll-behavior: contain;
  max-height: 45vh;
  gap: 6px;
  padding: 8px;
  font-size: 12px;
  border-radius: 16px;
}
.ckb-wstudio-inspector button {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 10px;
  font-size: 12px;
}
.ckb-wstudio-inspector .ckb-insp-rot-neg { display: inline-flex; align-items: center; justify-content: center; }
.ckb-insp-nudge { padding: 3px; gap: 3px; }
.ckb-insp-nudge button { min-width: 44px; min-height: 44px; }
.ckb-insp-swatches { max-width: 100%; overflow-x: auto; padding: 5px; gap: 5px; }
.ckb-insp-swatch { width: 32px !important; height: 32px !important; }
```

Keep the existing `≤380px` rule that hides `.ckb-insp-pos`.

- [ ] **Step 6: Verify sizes and rotation**

At 390px, run:

```js
const s = window.__studio;
s.selectItem(s.getState().items[0].id);
const insp = document.querySelector('#ckb-ws-test-insp');
const rects = [...insp.querySelectorAll('button')].map(b => b.getBoundingClientRect());
const swatch = insp.querySelector('.ckb-insp-swatch').getBoundingClientRect();
const rotBefore = s.getState().selectedItem.rotation;
document.querySelector('#ckb-ws-test-btn-rot-45').click();
const rotAfter = s.getState().selectedItem.rotation;
({
  minButton: Math.min(...rects.map(r => Math.min(r.width, r.height))),
  swatch: Math.min(swatch.width, swatch.height),
  rotBefore, rotAfter,
  pressed: insp.querySelector('.ckb-insp-swatch.on')?.getAttribute('aria-pressed'),
  pageOverflow: document.documentElement.scrollWidth > window.innerWidth
})
```

Expected: `minButton >= 44`, `swatch >= 32`, `rotAfter === rotBefore - 45`, `pressed === 'true'`, and no horizontal page overflow (`pageOverflow === false`). Also check at 320px that all buttons are still reachable by scrolling the panel.

- [ ] **Step 7: Verify desktop is unchanged**

At 800px wide: `getComputedStyle(document.querySelector('.ckb-insp-rot-neg')).display === 'none'` and the inspector still renders as the compact one-line bar with its previous button padding.

- [ ] **Step 8: Commit**

```bash
git add wordpress-plugin/chekadbam-studio/assets/studio-app.js wordpress-plugin/chekadbam-studio/assets/studio.css wordpress-plugin/chekadbam-studio/includes/wp-studio.php wordpress-plugin/chekadbam-studio/test-page.html
git commit -m "feat(studio): mobile-sized inspector controls with -45° rotation"
```

---

### Task 3: On-canvas zoom controls

**Files:**
- Modify: `wordpress-plugin/chekadbam-studio/assets/studio-app.js` (boot area ~2615–2637, helpers near `animateRadiusTo` ~950)
- Modify: `wordpress-plugin/chekadbam-studio/assets/studio.css` (mobile block)

**Interfaces:**
- Consumes: `animateRadiusTo(targetRadius)`, `cameraAngle.radius`, `space`, `hintSignal('zoom')`, `rootEl`, `.ckb-wstudio-viewport`, `--ckb-dock-h`, root class `ckb-inspector-open`.
- Produces: `.ckb-zoom-controls` element with `[data-zoom="in"]` and `[data-zoom="out"]` buttons; `zoomBy(factor)`.

- [ ] **Step 1: Add `zoomBy` and the control builder**

Near `animateRadiusTo`:

```js
function zoomBy(factor) {
  var maxDim = Math.max(space.width, space.length);
  var next = Math.max(4, Math.min(maxDim * 3, cameraAngle.radius * factor));
  animateRadiusTo(next);
  hintSignal('zoom');
}
```

Near boot:

```js
function buildZoomControls() {
  var vp = rootEl.querySelector('.ckb-wstudio-viewport');
  if (!vp || vp.querySelector('.ckb-zoom-controls')) return;
  var wrap = document.createElement('div');
  wrap.className = 'ckb-zoom-controls';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'زوم بوم');
  wrap.innerHTML =
    '<button type="button" data-zoom="in" title="بزرگ‌نمایی" aria-label="بزرگ‌نمایی بوم">＋</button>' +
    '<button type="button" data-zoom="out" title="کوچک‌نمایی" aria-label="کوچک‌نمایی بوم">−</button>';
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-zoom]') : null;
    if (!b) return;
    zoomBy(b.getAttribute('data-zoom') === 'in' ? 0.85 : 1.18);
  });
  vp.appendChild(wrap);
}
```

Call `buildZoomControls()` once during boot before `animate()`.

- [ ] **Step 2: Style and gate the control**

Base CSS:

```css
.ckb-zoom-controls { display: none; }
```

Inside the mobile media block:

```css
.ckb-zoom-controls {
  display: flex;
  position: absolute;
  left: 8px;
  bottom: calc(var(--ckb-dock-h, 56px) + env(safe-area-inset-bottom, 0px) + 10px);
  z-index: 24;
  flex-direction: column;
  gap: 6px;
}
.ckb-zoom-controls button {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.ckb-zoom-controls button:focus-visible { outline: 2px solid #34d399; outline-offset: 2px; }
.ckb-inspector-open .ckb-zoom-controls { display: none; }
```

- [ ] **Step 3: Verify zoom, clamp, hiding, and desktop**

At 390px:

```js
const s = window.__studio;
const wait = ms => new Promise(r => setTimeout(r, ms));
const controls = document.querySelector('.ckb-zoom-controls');
const inBtn = controls.querySelector('[data-zoom="in"]');
const outBtn = controls.querySelector('[data-zoom="out"]');
const r0 = s.getState().camera.radius;
inBtn.click(); await wait(450);
const r1 = s.getState().camera.radius;
s.selectItem(s.getState().items[0].id);
const hiddenWithInspector = getComputedStyle(controls).display;
s.selectItem(null);
const shownWithoutInspector = getComputedStyle(controls).display;
for (let i = 0; i < 20; i++) outBtn.click();
await wait(450);
const { width, length } = s.getState().space;
const maxDim = Math.max(width, length);
({ r0, r1, zoomedIn: r1 < r0, hiddenWithInspector, shownWithoutInspector,
   clamped: s.getState().camera.radius <= maxDim * 3 + 0.01,
   button: [inBtn.getBoundingClientRect().width, inBtn.getBoundingClientRect().height] })
```

Expected: `zoomedIn === true`, `hiddenWithInspector === 'none'`, `shownWithoutInspector === 'flex'`, `clamped === true`, button is 44×44. At 800px, `getComputedStyle(controls).display === 'none'`.

- [ ] **Step 4: Commit**

```bash
git add wordpress-plugin/chekadbam-studio/assets/studio-app.js wordpress-plugin/chekadbam-studio/assets/studio.css
git commit -m "feat(studio): add mobile on-canvas zoom controls"
```

---

### Task 4: Version bump, zip rebuild, and full acceptance pass

**Files:**
- Modify: `wordpress-plugin/chekadbam-studio/chekadbam-studio.php` (`Version:` header and `CKB_VERSION`)
- Modify: `wordpress-plugin/chekadbam-studio/readme.txt` (`Stable tag` + changelog)
- Rebuild: `wordpress-plugin/chekadbam-studio.zip`
- Modify: `docs/phase-2-mobile-touch-design.md` only if implementation forced a deviation.

**Interfaces:** none.

- [ ] **Step 1: Bump the plugin version to `2.18.0`**

Change `Version: 2.17.1` and `define( 'CKB_VERSION', '2.17.1' )` to `2.18.0`; update `Stable tag: 2.18.0`; add a `= 2.18.0 =` changelog entry (Persian) covering hardened pinch, mobile zoom buttons, 44px inspector controls, and `−۴۵°`.

- [ ] **Step 2: Rebuild the installable zip**

Run: `node wordpress-plugin/build-zip.js`
Expected: `wordpress-plugin/chekadbam-studio.zip` timestamp updated.

- [ ] **Step 3: Confirm the zip contains the changed assets**

Run: `tar -tf wordpress-plugin/chekadbam-studio.zip | Select-String "studio-app.js|studio.css|wp-studio.php"`
Expected: all three entries under `chekadbam-studio/`.

- [ ] **Step 4: Full acceptance pass at 390px**

Run the Task 1 pinch/leftover-finger script, Task 1 drag-cancel check, Task 2 size/rotation script, and Task 3 zoom script back-to-back on a freshly loaded test page. Confirm:

- pinch changes `camera.radius`, leaves `selectedId` alone, and leaves `selectedItem.x/z` unchanged;
- leftover finger does not change `theta/phi`;
- mid-drag pinch snaps `groupX/groupZ` back to `x/z`;
- inspector buttons ≥ 44px, swatches ≥ 32px, `−۴۵°` works;
- zoom buttons are 44px, animate, clamp, and hide while the inspector is open.

- [ ] **Step 5: Desktop regression at 800px**

Reload at 800px and confirm: compact inspector (no `−۴۵°`), no zoom controls, pinch/pointer logic untouched for a single mouse pointer, dock and canvas layout unchanged.

- [ ] **Step 6: Static checks**

Run: `node --check wordpress-plugin/chekadbam-studio/assets/studio-app.js`
Run: `git diff --check`
Expected: both clean.

- [ ] **Step 7: Commit release files**

```bash
git add wordpress-plugin/chekadbam-studio/chekadbam-studio.php wordpress-plugin/chekadbam-studio/readme.txt wordpress-plugin/chekadbam-studio.zip docs/phase-2-mobile-touch-design.md docs/superpowers/plans/2026-11-07-plugin-mobile-touch.md
git commit -m "chore(plugin): release 2.18.0 with mobile touch improvements"
```
