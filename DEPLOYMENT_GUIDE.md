# Deployment Guide

Two parts: (1) wiring up the Google Sheet backend, (2) publishing the site on GitHub Pages.

---

## Part 1 — Google Sheet + Apps Script backend

### 1. Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Name it something like `Portfolio Contact Responses`.
3. Leave it empty — the script creates the `Responses` tab and header row automatically the first time it runs.

### 2. Add the Apps Script
1. In the sheet, go to **Extensions → Apps Script**.
2. Delete any placeholder code in the editor.
3. Paste in the entire contents of `Code.gs` (included in this project).
4. Click the **save icon** (or `Ctrl+S` / `Cmd+S`) and name the project, e.g. `Portfolio Backend`.

### 3. Deploy as a Web App
1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure:
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. The first time, Google will ask you to **authorize** the script — click through the consent screens (it's your own script, so this is expected).
6. Copy the **Web app URL** it gives you — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### 4. Connect it to the site
1. Open `script.js`.
2. Find this line near the top:
   ```js
   GOOGLE_SCRIPT_URL: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
   ```
3. Replace the placeholder with the URL you copied. It should look like:
   ```js
   GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
4. Save the file. That's it — the contact form now POSTs to your sheet, and the Admin Dashboard GETs from it. If the URL is left as the placeholder, the site automatically falls back to `localStorage` only, so nothing breaks.

> **Note on redeploying:** any time you edit `Code.gs`, you need to create a **new version** of the deployment (Deploy → Manage deployments → Edit → New version) for the changes to go live. The URL stays the same.

---

## Part 2 — GitHub & GitHub Pages deployment

### 1. Initialize a local Git repository
Open a terminal in your project folder (the one containing `index.html`, `styles.css`, `script.js`) and run:

```bash
git init
git add .
git commit -m "Initial commit: portfolio site"
```

### 2. Create a new repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name it, e.g. `raj-portfolio`.
3. Keep it **Public** (required for free GitHub Pages).
4. **Do not** initialize with a README, .gitignore, or license — you already have local files.
5. Click **Create repository**.

### 3. Push your local code to GitHub
GitHub will show you commands after creating the repo — they'll look like this (replace `YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/raj-portfolio.git
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages
1. In your repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
4. Wait a minute or two, then refresh the page — GitHub will show your live URL, typically:
   ```
   https://YOUR-USERNAME.github.io/raj-portfolio/
   ```

### 5. Future updates
Whenever you change the site, redeploy with:

```bash
git add .
git commit -m "Describe your change"
git push
```

GitHub Pages automatically rebuilds within a minute or two of each push.

---

## A quick security note on the Admin Dashboard

The admin login in `script.js` is a **client-side convenience gate**, not real security — the username/password live in a JavaScript file that anyone can view. It's fine for keeping casual visitors from opening the panel, but don't rely on it to protect sensitive information, and don't reuse a real password there. If you need actual access control later, that requires a real backend with server-side authentication.
