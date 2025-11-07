#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const binDir = path.join(projectRoot, 'node_modules', '.bin');
const unixBin = path.join(binDir, 'ng');
const unixBackup = path.join(binDir, 'ng-real');
const windowsBin = path.join(binDir, 'ng.cmd');
const windowsBackup = path.join(binDir, 'ng-real.cmd');

try {
  ensureUnixWrapper();
  ensureWindowsWrapper();
} catch (error) {
  console.warn('[ng-live] Failed to install wrapper:', error);
}

function ensureUnixWrapper() {
  if (!fs.existsSync(unixBin)) {
    return;
  }

  const current = fs.readFileSync(unixBin, 'utf8');
  const desiredReference = '../../tools/ng-live.cjs';

  if (current.includes(desiredReference)) {
    return;
  }

  if (!fs.existsSync(unixBackup)) {
    fs.renameSync(unixBin, unixBackup);
  }

  const script = `#!/usr/bin/env node\nrequire('${desiredReference}');\n`;
  fs.writeFileSync(unixBin, script, { mode: 0o755 });
}

function ensureWindowsWrapper() {
  if (!fs.existsSync(windowsBin)) {
    return;
  }

  const current = fs.readFileSync(windowsBin, 'utf8');
  const desiredReference = '..\\..\\tools\\ng-live.cjs';

  if (current.includes(desiredReference)) {
    return;
  }

  if (!fs.existsSync(windowsBackup)) {
    fs.renameSync(windowsBin, windowsBackup);
  }

  const script = `@ECHO OFF\r\nSETLOCAL\r\nSET "_BASEDIR=%~dp0"\r\nIF EXIST "%_BASEDIR%node.exe" (\r\n  "%_BASEDIR%node.exe"  "%_BASEDIR%${desiredReference}" %*\r\n) ELSE (\r\n  node "%_BASEDIR%${desiredReference}" %*\r\n)\r\n`;
  fs.writeFileSync(windowsBin, script, { mode: 0o755 });
}
