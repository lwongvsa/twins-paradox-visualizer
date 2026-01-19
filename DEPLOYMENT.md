# Deployment Guide for GitHub Pages

This guide will help you deploy the Twin Paradox Visualizer to GitHub Pages.

## Prerequisites

1. Node.js installed on your system
2. A GitHub repository
3. A Gemini API key (for the AI chat feature)

## Step-by-Step Deployment

### 1. Build the Project

First, install dependencies and build the project:

```bash
npm install
npm run build
```

This will create a `dist` folder with all the production-ready files.

### 2. Configure Base Path (if needed)

If your repository is NOT at the root of your GitHub Pages site (e.g., `username.github.io/repo-name`), you need to set the base path:

1. Open `vite.config.ts`
2. Update the `base` variable:
   ```typescript
   const base = '/your-repo-name/';  // Replace with your actual repo name
   ```
3. Rebuild: `npm run build`

If your site is at the root (`username.github.io`), keep `base: '/'`.

### 3. Deploy to GitHub Pages

#### Option A: Manual Deployment

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose **Branch: main** (or your default branch)
5. Select **Folder: / (root)** or **/docs** if you want to use a docs folder
6. Click **Save**

If using the root folder:
- Copy the contents of the `dist` folder to the root of your repository
- Commit and push

If using `/docs` folder:
- Copy the contents of the `dist` folder to a `docs` folder in your repository
- Update the base path in `vite.config.ts` to `/your-repo-name/` if needed
- Commit and push

#### Option B: Automatic Deployment with GitHub Actions (Recommended)

A GitHub Actions workflow file (`.github/workflows/deploy.yml`) has been created for you. This will automatically build and deploy your site whenever you push to the main branch.

1. Make sure you have a `.github/workflows/deploy.yml` file (see below)
2. Push your code to GitHub
3. The workflow will automatically build and deploy

### 4. Environment Variables

**Note**: The AI chat feature has been removed from this version, so no API keys are needed. The visualization works completely standalone.

### 5. Verify Deployment

1. Wait a few minutes for GitHub Pages to build
2. Visit `https://your-username.github.io/repo-name` (or your custom domain)
3. You should see the Twin Paradox Visualizer

## Troubleshooting

### Blank Page / Only Background Color

- **Check browser console** for errors (F12 → Console)
- **Verify the base path** matches your repository structure
- **Ensure all files are in the correct location** (dist folder contents should be at root or in docs)
- **Check that the build completed successfully** without errors

### API Key Issues

- If the chat doesn't work, check the browser console for API errors
- Verify your API key is set correctly
- Check that the API key has the necessary permissions

### Build Errors

- Make sure all dependencies are installed: `npm install`
- Check that Node.js version is compatible (v18+ recommended)
- Review any error messages in the terminal

## Notes

- GitHub Pages may take a few minutes to update after pushing changes
- The site will be available at `https://username.github.io/repo-name`
- For custom domains, configure it in GitHub Pages settings

