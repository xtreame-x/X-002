# ✨ Halo — Liquid Glass New Tab Dashboard

> A clean, aesthetic, Apple-inspired **Liquid Glass** New Tab dashboard for Chromium browsers. Featuring customizable frosted glass transparency, bundled live video wallpapers, Spotlight search (`Ctrl + K`), Dynamic Island, and offline productivity widgets.

---

## 🚀 Quick Setup (30 Seconds)

You can install this extension on **Google Chrome**, **Brave**, **Microsoft Edge**, **Arc**, or any Chromium-based browser.

### Step 1: Download & Extract
1. Click the green **Code** button at the top right of this repo and select **Download ZIP** (or clone the repository):
   ```bash
   git clone https://github.com/xtreame-x/X-002.git
   ```
2. Unzip the downloaded file and place the folder in a permanent location (e.g., inside your `Documents` or `Projects` folder).

### Step 2: Load into Your Browser
1. Open your browser and go to the extensions manager:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Turn **ON** the **Developer mode** toggle (usually in the top-right corner).
3. Click the **Load unpacked** button (in the top-left).
4. Select the unzipped folder containing `manifest.json`.

### Step 3: Open a New Tab
Press <kbd>Ctrl</kbd> + <kbd>T</kbd> (or <kbd>Cmd</kbd> + <kbd>T</kbd> on macOS). Your Liquid Glass dashboard is live immediately! ✨

---

## 💎 Features

### 🧊 Liquid Glassmorphism & Idle Ambient Blend
- **Real-Time Glass Shaders**: Combines dual-layer frosted backdrop blur (`backdrop-filter: blur(24px) saturate(120%)`), top-edge specular highlights, and soft depth shadows.
- **Per-Widget Transparency**: Customise the transparency, outline border, and blur of individual widgets or globally across the dashboard.
- **Idle Ambient Blend (Apple StandBy Mode)**: When untouched, widget cards dissolve into pure transparency, leaving sharp high-contrast text and clock numerals floating effortlessly over your wallpaper. Hovering or touching instantly wakes the card.

### 🎬 Offline Live Wallpapers & Unified Shelf
- **Bundled Out-of-the-Box**: Includes high-framerate, seamless ambient looping videos (`Black and white.mp4` default, `Grey.mp4`, `eyes.jpg`, and original scenic background).
- **Custom Uploads**: Supports adding your own `.mp4`, `.webm`, `.jpg`, `.png`, or `.gif` wallpapers via local file upload or direct URL.
- **In-Place Replace & Delete**: Swap or delete any wallpaper card on your shelf with one click.
- **Zero-Flash Autoplay**: Preloaded directly into the DOM so new tabs open instantly with motion and zero white flash.

### ⚡ Spotlight Command Palette (<kbd>Ctrl</kbd> + <kbd>K</kbd>)
- Quick launcher with instant fuzzy search for pinned apps and bookmarks.
- **Inline Calculator**: Type `= 48 * 12` to get instant math calculations (press <kbd>Enter</kbd> to copy).
- **Todo Quick-Add**: Type `t: buy coffee` or `todo: review PR` to append tasks directly.
- **Focus Launcher**: Type `f: 25` or `focus: 45` to trigger Ultra Focus mode.
- **Weather Quick-Check**: Type `w: Tokyo` to update live conditions.

### 🏝️ Apple Dynamic Island & Focus Mode
- Interactive floating Dynamic Island pill during focus sessions with fluid spring hover expansion.
- 1-click expand to return to full Ultra Focus mode.
- Subtle 3D gyro-tilt physics responding to cursor proximity.

### 🛠️ Productivity Widgets
- **Todo List**: Quick task management with interactive completion and counter badges.
- **Quick Links (3x3)**: Pinned apps that open directly in the same tab, featuring mobile-style jiggle edit mode, drag-and-drop reordering, and trash removal.
- **Calendar & Live Clock**: Multiple clock styles including Digital, Orbitron, and Pirata One ("Dragon").
- **Notes & Weather**: Auto-locating live weather (with silent IP fallback for privacy) and quick scratchpad notes.

---

## ⌨️ Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Spotlight Command Palette |
| <kbd>Esc</kbd> | Close Spotlight / Open Modals |
| <kbd>Ctrl</kbd> + Click | Open Quick Link in background tab |

---

## 🔒 Privacy & Offline First

- **100% Offline-Capable**: All assets, fonts, icons, and wallpapers are bundled locally.
- **Zero Tracking**: No telemetry, analytics, or external accounts required.
- **Local Storage**: All your tasks, notes, custom wallpapers, and preferences are stored securely inside your browser's `localStorage` and `IndexedDB`.

---

## 📄 License

MIT License — Feel free to use, modify, and customize for personal use!
