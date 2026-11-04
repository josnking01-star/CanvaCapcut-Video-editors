import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function main() {
  const rootDir = process.cwd();
  const outDir = path.join(rootDir, 'public', 'downloads');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Packaging OmniCut Studio Elite full project source...');
  const zip = new JSZip();

  const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'dist_electron', 'coverage', '.playwright-cli', '.vscode']);
  const ignoreFiles = new Set(['.env']);

  function addDirToZip(currentPath: string, zipFolder: JSZip) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        const subFolder = zipFolder.folder(entry.name);
        if (subFolder) {
          addDirToZip(fullPath, subFolder);
        }
      } else if (entry.isFile()) {
        if (ignoreFiles.has(entry.name)) continue;
        if (entry.name.endsWith('.log')) continue;
        // avoid self-nesting large generated zips inside public/downloads
        if (relPath.startsWith('public/downloads') && entry.name.endsWith('.zip')) continue;

        const data = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, data);
      }
    }
  }

  addDirToZip(rootDir, zip);

  // Add Windows Easy-Run script
  const launcherBat = `@echo off
title OmniCut Studio Elite v3.0 - Local PC Launcher
echo ========================================================
echo   OmniCut Studio Elite v3.0 - Starting Local Engine
echo ========================================================
echo Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run on Windows.
    echo Please install LTS Node.js from: https://nodejs.org/
    echo Once installed, double-click this file again!
    pause
    exit /b
)
echo Checking dependencies...
if not exist "node_modules\\" (
    echo Installing local dependencies...
    call npm install
)
echo Launching OmniCut Studio Elite at http://localhost:3000 ...
start http://localhost:3000
call npm run dev
pause
`;
  zip.file('Launch_OmniCut_Studio.bat', launcherBat);

  // Add Windows EXE Builder script
  const buildExeBat = `@echo off
title Build Windows .exe - OmniCut Studio Elite
echo ========================================================
echo   Building Standalone Windows x64 Executable (.exe)
echo ========================================================
echo Installing desktop build tools...
call npm install --save-dev electron electron-builder
echo Building client and server...
call npm run build
echo Packaging Windows NSIS installer and portable exe...
call npx electron-builder --windows --x64
echo.
echo ========================================================
echo Complete! Your .exe installer is in: dist_electron/
echo ========================================================
pause
`;
  zip.file('Build_Windows_EXE.bat', buildExeBat);

  // Add Quick Start Guide
  const readmeContent = `# OmniCut Studio Elite v3.0 - Local PC Execution & Build Guide

## 1. Quick Start on Windows PC (Local Execution)
1. Ensure **Node.js 18 or 20+** is installed on your Windows PC from [nodejs.org](https://nodejs.org/).
2. Double-click \`Launch_OmniCut_Studio.bat\`.
3. It will install packages and automatically open **http://localhost:3000** in your browser!

## 2. How to Build the Standalone Windows .exe File
### Option A: Automated GitHub Actions (Recommended)
1. Push this project to your GitHub repository.
2. Go to **Actions** tab on GitHub -> **Build Windows Native Desktop EXE**.
3. It runs automatically and uploads the **.exe** installer and standalone release artifact!

### Option B: Build .exe Locally on Windows
1. Double-click \`Build_Windows_EXE.bat\`.
2. Wait for Electron builder to compile the package.
3. Open the newly created \`dist_electron/\` folder to find your:
   - \`OmniCut Studio Elite_Setup_v1.0.0.exe\` (NSIS Installer)
   - Portable Standalone \`.exe\`

## 3. Master Owner Access
- Master Owner Account: \`josnking01@gmail.com\`
- Supreme Authority with tamper-proof security guards.
`;
  zip.file('README_WINDOWS_SETUP.md', readmeContent);

  const fullZipPath = path.join(outDir, 'OmniCutStudioElite_Full_Project_Source.zip');
  console.log('Generating ZIP buffer...');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(fullZipPath, buffer);
  console.log(`Success! Written full project ZIP: ${fullZipPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Also create Windows Portable Bundle
  const portableZipPath = path.join(outDir, 'OmniCutStudioElite_Windows_Portable.zip');
  fs.copyFileSync(fullZipPath, portableZipPath);
  console.log(`Copied portable bundle: ${portableZipPath}`);
}

main().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
