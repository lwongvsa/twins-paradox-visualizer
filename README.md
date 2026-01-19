<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Twin Paradox Visualizer

An interactive visualization of the Twin Paradox using Special Relativity principles, built with React, D3, and powered by Gemini AI.

View your app in AI Studio: https://ai.studio/apps/drive/1v4zGg8JacSeGnL3u3HgmA6362MRTi_Z2

## Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. **No environment variables needed** - The AI chat feature has been removed. The visualization works completely standalone.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Build for Production

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

## Deploy to GitHub Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Steps:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Configure base path** (if your repo is not at root):
   - Edit `vite.config.ts` and set `base: '/your-repo-name/'`

3. **Deploy:**
   - **Option A (Automatic)**: Push to GitHub. The GitHub Actions workflow will automatically build and deploy.
   - **Option B (Manual)**: Copy contents of `dist` folder to your repository root or `docs` folder, then configure GitHub Pages in repository settings.

4. **No API keys needed** - The app works completely standalone without any API keys.

## Features

- Interactive Minkowski spacetime diagrams
- Step-by-step visualization of the Twin Paradox
- Real-time physics calculations (time dilation, length contraction)
- Customizable parameters (distance, velocity)
- Signal visualization showing Doppler effects

## Troubleshooting

### Blank page on GitHub Pages?

1. Check browser console for errors (F12)
2. Verify the `base` path in `vite.config.ts` matches your repository structure
3. Ensure the build completed successfully
4. Check that all files from `dist` are in the correct location

