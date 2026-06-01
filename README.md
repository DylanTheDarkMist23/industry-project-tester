# WandCraft

> A little web app that lets you send someone a surprise image — but they have to earn it first.

You lock an image behind a wand-tracing minigame, generate a shareable link, and your recipient has to trace their way through a carved groove on a wand to unlock it. Part puzzle game, part gift wrapper.

---

## How it works

**Sender side** — Fill in a short form: your name, an opening message, a closing message, a photo, and a difficulty setting. Hit generate and the app uploads your image and spits out a short link. Send it to whoever you want.

**Receiver side** — They open the link, see your name and opening message, then play the game. The wand groove is revealed one segment at a time (no cheating by drawing a straight line). Once they finish all the segments, the image and your ending message appear.

---

## Project structure

```
wandcraft/
├── index.html          # Main page — loads everything else
├── style.css           # All colours, fonts and layout
└── js/
    ├── config.js       # Settings and constants (easy to tweak)
    ├── utils.js        # Small helper functions
    └── app.js          # Game logic
```

All code files are heavily commented, so you can follow along even without much JavaScript experience.

---

## Getting started

### Run locally

Open `index.html` in Chrome or Firefox — the sender form loads straight away.

To test the full flow end-to-end, generate a link and paste it into a new tab.

> **Note:** `file://` links only work on your own machine. To test the receiver side on another device, you'll need to host it online (see below).

### Deploy to GitHub Pages

1. Create a free account at [github.com](https://github.com)
2. Create a new public repository (e.g. `wandcraft`)
3. Upload all files, keeping the `js/` folder intact
4. Go to **Settings → Pages**, select the `main` branch, and click **Save**
5. After about a minute, your app will be live at `https://YOUR-NAME.github.io/wandcraft/`

---

## Requirements

- A modern browser (Chrome, Firefox, Edge, or Safari)
- An internet connection (for image upload)
- A free [imgbb API key](https://api.imgbb.com) — takes about a minute to get

---

## Configuration

Everything easy to tweak lives in `js/config.js` — the timer, groove shape, difficulty settings, and colours. Change a value there and it updates everywhere; no need to touch the main app code.

---

## Credits

- [LZ-String](https://github.com/pieroxy/lz-string) compression library by pieroxy
- Image hosting by [imgbb.com](https://imgbb.com)
- Concept, design and code by Dylan
