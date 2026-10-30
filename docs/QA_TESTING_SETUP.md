# Sharing PokéShapes with QA Testers (Before Going Live on `pokeshapes.com`)

I have configured three ways for you to share a live QA link with your testers without connecting or launching **`pokeshapes.com`** yet:

---

## Option 1: Free 24/7 QA Staging Link via GitHub Pages (Recommended)
**Best when:** You want a permanent 24/7 QA link (`https://liskadi.github.io/PokeShapes/`) that testers can open on desktop or mobile anytime—even when your PC is turned off.

### What I Already Configured for You:
- Created [`.github/workflows/qa-staging.yml`](../.github/workflows/qa-staging.yml) to automatically build and publish your QA site on every `git push`.
- Updated [`vite.config.ts`](../vite.config.ts) with `base: './'` so Web Workers, sprites, and assets work seamlessly on subpath URLs like `/PokeShapes/`.

### How to Activate It (Takes 30 Seconds):
1. On GitHub, open your repository: **`https://github.com/liskadi/PokeShapes/settings/pages`**
2. Under **Build and deployment** → **Source**, change the dropdown from *"Deploy from a branch"* to **"GitHub Actions"**.
3. Push your code:
   ```bash
   git add .
   git commit -m "Add QA staging setup and pokeshapes.com production config"
   git push origin main
   ```
4. Within ~45 seconds, your live QA link will be active 24/7 at:
   👉 **`https://liskadi.github.io/PokeShapes/`**

---

## Option 2: Private `*.pages.dev` Staging Link on Cloudflare (No Custom Domain Attached)
**Best when:** You want to test on Cloudflare's exact edge infrastructure (or put a password screen in front of it with Cloudflare Zero Trust) before attaching `pokeshapes.com`.

### How to Run It:
Run this single command in `E:\Argon\PokeShapes`:
```bash
npm run qa:cloudflare
```
- The first time you run it, it will open a browser tab asking you to authorize Cloudflare and will publish your `dist/` folder to a private preview URL like **`https://pokeshapes-qa.pages.dev`** (leaving `pokeshapes.com` completely untouched).

---

## Option 3: Instant Temporary Tunnel from Your PC (`*.trycloudflare.com`)
**Best when:** You are making live code tweaks on your computer and want QA testers or your UI/UX designer to preview your local server in real time without pushing to Git.

### How to Run It:
1. In Terminal 1, start the preview server:
   ```bash
   npm run preview
   ```
2. In Terminal 2, open the instant HTTPS tunnel:
   ```bash
   npm run qa:tunnel
   ```
3. Copy the generated **`https://random-words.trycloudflare.com`** link from the terminal and send it to your QA testers. When you close the terminal, the link immediately shuts down.
