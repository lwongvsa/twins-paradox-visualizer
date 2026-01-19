# Quick Start Guide

## Why is the page blank when I open index.html directly?

**You cannot open `index.html` directly in a browser!** This is a React + TypeScript application that needs to be:
1. **Built for production** (creates optimized files), OR
2. **Run with a development server** (for testing)

## Solution: Build the Project

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build for Production
```bash
npm run build
```

This creates a `dist` folder with all the production files.

### Step 3: Serve the Built Files

**Option A: Use Vite Preview (Recommended for Testing)**
```bash
npm run preview
```
Then open `http://localhost:4173` in your browser.

**Option B: Use a Simple HTTP Server**
```bash
# Install a simple server globally (one time)
npm install -g http-server

# Navigate to dist folder and serve
cd dist
http-server
```

**Option C: Deploy to GitHub Pages**
- Copy all files from `dist` folder to your repository
- Enable GitHub Pages in repository settings
- Your site will be live at `https://username.github.io/repo-name`

## For Development (Testing Changes)

Instead of building, you can run a development server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Common Issues

### "Blank page" or "Only background color"
- ✅ **Solution**: Build the project first (`npm run build`)
- ✅ **Then**: Serve the `dist` folder, don't open `index.html` directly

### "Module not found" errors
- ✅ **Solution**: Make sure you ran `npm install` first

### Tailwind CSS warning in console
- ⚠️ This is just a warning, not an error
- The app will still work, but consider installing Tailwind properly for production

