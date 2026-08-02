# 🌷 StudyNook — Study Tracker

A cute, pastel study tracker with a dashboard, calendar, Pomodoro timer, performance
charts, subjects, tasks, streaks, and settings. Data is saved in your browser's
`localStorage`, so it stays there between visits, refreshes, and browser restarts
(on that browser/device).

## What to upload to GitHub

Upload the **entire contents of this folder** (not the folder itself as a
single file) to your GitHub repo — i.e. `package.json`, `index.html`, the
`src/` folder, the config files, `.gitignore`, and this `README.md` should
all sit at the root of the repo. Do **not** upload a `node_modules` folder
even if one gets created on your machine — it's excluded by `.gitignore` and
Vercel/Netlify install it automatically from `package.json`.

```
study-tracker/            ← upload everything in here
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx
    ├── index.css
    └── main.jsx
```

No API keys, secrets, or passwords are used anywhere in this project, so
there's nothing sensitive to strip out before making the repo public.

## 1. Run it on your computer

**Requirements:** [Node.js](https://nodejs.org) version 18 or newer.

```bash
# 1. Unzip the project, then open a terminal in the folder
cd study-tracker

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Vite will print a local address, usually `http://localhost:5173`. Open that in
your browser — the app is now running locally.

To stop the server, press `Ctrl + C` in the terminal.

## 2. Build for production

```bash
npm run build
```

This creates an optimized `dist/` folder you can deploy anywhere that serves
static files. You can preview the production build locally with:

```bash
npm run preview
```

## 3. Deploy it online for free

Any static host works since this is a plain Vite/React app. Here are three free
options — pick whichever you're most comfortable with.

### Option A: Vercel (recommended, easiest)

1. Push this project to a GitHub repository (see step 5 below if you haven't
   used Git before).
2. Go to [vercel.com](https://vercel.com) and sign up/log in with your GitHub
   account.
3. Click **Add New → Project**, then select your `study-tracker` repo.
4. Vercel auto-detects Vite. Leave the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**. In about a minute you'll get a free URL like
   `study-tracker.vercel.app`.
6. Any time you push new commits to GitHub, Vercel redeploys automatically.

### Option B: Netlify

1. Push the project to GitHub.
2. Go to [netlify.com](https://netlify.com) and sign up/log in with GitHub.
3. Click **Add new site → Import an existing project**, choose your repo.
4. Set:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**. You'll get a free URL like
   `study-tracker.netlify.app`.

### Option C: GitHub Pages

1. Install the GitHub Pages helper:
   ```bash
   npm install --save-dev gh-pages
   ```
2. In `package.json`, add:
   ```json
   "homepage": "https://<your-username>.github.io/study-tracker",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. In `vite.config.js`, set the base path so assets resolve correctly:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: "/study-tracker/",
   });
   ```
4. Push the project to a GitHub repo named `study-tracker`, then run:
   ```bash
   npm run deploy
   ```
5. Your site will be live at `https://<your-username>.github.io/study-tracker`.

## 4. Getting the project onto GitHub (if you're new to Git)

```bash
cd study-tracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/study-tracker.git
git push -u origin main
```

Create the empty repository on [github.com/new](https://github.com/new) first,
then run the commands above.

## About your data

This app stores everything — study logs, tasks, subjects, streaks, settings —
in the browser's `localStorage`, under the key `study-tracker-data-v1`. That
means:

- Data persists across refreshes and browser restarts, on that same browser.
- Data is **local to each browser/device** — it won't sync between your phone
  and laptop, or between Chrome and Safari, unless you export/import it.
- Clearing your browser's site data/cache will erase it, so use **Settings →
  Export study data** occasionally to download a backup JSON file.
- If you outgrow `localStorage` later, the data shape (in `src/App.jsx`,
  `defaultData()`) is a plain JSON object, so it's straightforward to swap in
  a real backend (e.g. Supabase, Firebase) down the line.

## Project structure

```
study-tracker/
├── index.html          # HTML entry point, loads Google Fonts
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # The entire app (all pages/components)
    └── index.css        # Tailwind imports
```

Enjoy your studying! 🌷📚
