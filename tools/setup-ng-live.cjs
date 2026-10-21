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

  const script = `#!/usr/bin/env node\nrequire('${desiredReference}');\n`;
  replaceBin(unixBin, unixBackup, script);
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

  const script = `@ECHO OFF\r\nSETLOCAL\r\nSET "_BASEDIR=%~dp0"\r\nIF EXIST "%_BASEDIR%node.exe" (\r\n  "%_BASEDIR%node.exe"  "%_BASEDIR%${desiredReference}" %*\r\n) ELSE (\r\n  node "%_BASEDIR%${desiredReference}" %*\r\n)\r\n`;
  replaceBin(windowsBin, windowsBackup, script);
}

/**
 * Sustituye el binario por el wrapper SIN escribir a través de un enlace simbólico: npm
 * enlaza `.bin/ng` a `@angular/cli/bin/ng.js`, y si ya existía una copia de seguridad
 * (p. ej. restaurada de la caché de Vercel) escribir sobre el enlace machacaría el fichero
 * real de Angular CLI.
 */
function replaceBin(file, backup, content) {
  if (!fs.existsSync(backup) && !isDanglingLink(backup)) {
    fs.renameSync(file, backup);
  } else {
    fs.rmSync(file, { force: true });
  }
  fs.writeFileSync(file, content, { mode: 0o755 });
}

function isDanglingLink(file) {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch {
    return false;
  }
}
