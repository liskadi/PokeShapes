# Deploying PokéShapes to `pokeshapes.com` on Cloudflare Pages

Since you purchased **`pokeshapes.com`** through **Cloudflare Registrar**, deploying your GitHub repository (`liskadi/PokeShapes`) to **Cloudflare Pages** takes less than 3 minutes and gives you **unlimited free bandwidth**, automatic SSL certificates, and automatic deploys on every `git push`.

---

## Step 1: Push Your Latest Code to GitHub
Run these commands in `E:\Argon\PokeShapes`:
```bash
git add .
git commit -m "Configure pokeshapes.com SEO, OpenGraph, viral share URL, and Cloudflare Pages headers"
git push origin main
```

---

## Step 2: Connect Your GitHub Repo to Cloudflare Pages
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click **Compute (Workers & Pages)** → **Workers & Pages**.
3. Click the **Create** button → select the **Pages** tab → click **Import an existing Git repository** (`Get started`).
4. Authorize your GitHub account (`liskadi`) and select the **`PokeShapes`** repository.
5. Under **Set up builds and deployments**, use these exact settings:
   - **Project name**: `pokeshapes`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**. Cloudflare will build your project in ~35 seconds and give you a live preview URL (`pokeshapes.pages.dev`).

---

## Step 3: Attach `pokeshapes.com` in 1 Click
1. Once the build finishes, click **Continue to project** and open the **Custom domains** tab at the top of your `pokeshapes` Pages project.
2. Click **Set up a custom domain**.
3. Type **`pokeshapes.com`** → click **Continue** → click **Activate domain**.
   - *Because `pokeshapes.com` is on Cloudflare Registrar, Cloudflare automatically adds the `CNAME` record to your DNS and issues your HTTPS SSL certificate in ~30 seconds!*
4. Click **Set up a custom domain** a second time and add **`www.pokeshapes.com`** as well.

---

## Step 4: Redirect `www.pokeshapes.com` → `https://pokeshapes.com` (Important!)
Because daily Streaks and **PolyDex** progress are stored in the player's browser `localStorage` & `IndexedDB` (which are scoped to the exact domain name), you want 100% of players on **`https://pokeshapes.com`** (and never split between `www.` and non-`www`).

1. In your Cloudflare Dashboard, click **Websites** in the left sidebar and select **`pokeshapes.com`**.
2. Go to **Rules** → **Overview** (or **Redirect Rules**) → click **Create rule** (or select the **"Redirect from WWW to root"** template).
3. Set:
   - **When incoming requests match**: Hostname equals `www.pokeshapes.com`
   - **Then**: URL Redirect → Type: `Dynamic`, Expression: `concat("https://pokeshapes.com", http.request.uri.path)` → Status code: `301`
4. Click **Deploy**.

---

## Step 5: Enable Free Privacy-First Analytics (Optional)
1. Inside your **`pokeshapes`** Cloudflare Pages project, click the **Metrics / Web Analytics** tab and click **Enable Web Analytics**.
2. This gives you real-time daily player counts, countries, and referral sources (Discord, Reddit, X, Google) with **zero cookies** and **zero performance impact**.
