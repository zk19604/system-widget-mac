# System Widget (Übersicht)

One panel, top-right corner of your desktop, black/white/grey terminal
style, with three sections: CPU, Memory, Disk. Hover over any section to
reveal its details (top processes, or largest folders for Disk).

## If you already installed the old 3-widget version

Delete `cpu-widget`, `memory-widget`, and `disk-widget` from your Übersicht
widgets folder first (this package replaces them with one `system-widget`
folder).

## 1. Install Übersicht (skip if already installed)

Free, from https://tracesof.net/uebersicht/ — drag to Applications, open it.

## 2. Open your widgets folder

Click the Übersicht menu bar icon → **"Open widgets folder"**. This opens:
```
~/Library/Application Support/Übersicht/widgets/
```

## 3. Remove the default example widget (the white "Hi, zk" panel)

In that same folder, delete whichever folder contains Übersicht's built-in
welcome widget (usually named something like `example-widget` or
`hello-widget`).

## 4. Add this widget

Copy the `system-widget` folder from this download into the widgets folder.

## 5. Refresh

Übersicht menu bar icon → **Refresh**. The panel should appear top-right.

## Customizing

Open `system-widget/index.jsx` in any text editor.

- **Position:** near the top of the `className` block, change `top:` and
  `right:` (in pixels). It's currently anchored to the right edge — if you
  want it anchored to the left instead, replace `right: 20px; left: auto;`
  with `left: 20px; right: auto;`.
- **Colors:** currently pure black/white/grey. Search for hex values like
  `#fff`, `#999`, `#666`, `rgba(255, 255, 255, ...)` to adjust shades.
- **Refresh speed:** `refreshFrequency` is in milliseconds, set to 15000
  (15s) since the Disk section scans your home folder each refresh, which
  is heavier than a plain CPU/RAM check. Lower it for a snappier feel, or
  raise it if you notice any lag.
- **Hover details:** each section's expandable list lives in that section's
  JSX inside the `render` function — search for `.details` to find them.

## Notes

- Memory % uses `memory_pressure`, which matches what Activity Monitor
  shows — not `top`'s raw "unused" figure, which reads as almost-full even
  on a healthy Mac because macOS fills spare RAM with disk cache.
- The Disk "largest folders" list only scans one level deep inside your
  home folder (`~`). Edit the `du -d 1 -h ~` command in the widget's
  `command` string to scan elsewhere or deeper (`-d 2`), just know deeper
  scans take longer.
