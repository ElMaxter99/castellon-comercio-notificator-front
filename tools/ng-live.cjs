#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: npm run ng -- <command> [options]');
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

let liveFlag;
const filteredArgs = [];

for (let i = 0; i < commandArgs.length; i += 1) {
  const current = commandArgs[i];

  if (current === '--live') {
    const next = commandArgs[i + 1];

    if (next && !next.startsWith('-')) {
      liveFlag = parseLiveValue(next);
      i += 1;
    } else {
      liveFlag = true;
    }

    continue;
  }

  if (current.startsWith('--live=')) {
    const [, raw] = current.split('=');
    liveFlag = parseLiveValue(raw);
    continue;
  }

  filteredArgs.push(current);
}

if (liveFlag === undefined) {
  liveFlag = true;
}

const finalArgs = !liveFlag
  ? [command, ...applyMockConfiguration(command, filteredArgs)]
  : [command, ...filteredArgs];

const ngBin = require.resolve('@angular/cli/bin/ng');
const result = spawnSync(process.execPath, [ngBin, ...finalArgs], {
  stdio: 'inherit'
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);

function parseLiveValue(value) {
  const normalised = String(value).toLowerCase();

  if (['false', '0', 'no', 'off'].includes(normalised)) {
    return false;
  }

  return true;
}

function applyMockConfiguration(commandName, args) {
  const updatedArgs = [...args];
  const commandDefaults = {
    build: 'development',
    serve: 'development',
    'dev-server': 'development'
  };

  const mockSuffix = '-mock';
  let configurationFound = false;

  for (let i = 0; i < updatedArgs.length; i += 1) {
    const current = updatedArgs[i];

    if (current === '--configuration' || current === '-c') {
      if (i + 1 >= updatedArgs.length) {
        throw new Error('Missing configuration value after --configuration flag.');
      }

      updatedArgs[i + 1] = ensureMockConfiguration(updatedArgs[i + 1]);
      configurationFound = true;
      i += 1;
      continue;
    }

    if (current.startsWith('--configuration=')) {
      updatedArgs[i] = `--configuration=${ensureMockConfiguration(current.split('=')[1])}`;
      configurationFound = true;
      continue;
    }

    if (current.startsWith('-c=')) {
      updatedArgs[i] = `-c=${ensureMockConfiguration(current.split('=')[1])}`;
      configurationFound = true;
      continue;
    }
  }

  if (!configurationFound) {
    const fallback = commandDefaults[commandName];

    if (!fallback) {
      return updatedArgs;
    }

    updatedArgs.push(`--configuration=${ensureMockConfiguration(fallback)}`);
  }

  return updatedArgs;

  function ensureMockConfiguration(value) {
    if (value.endsWith(mockSuffix)) {
      return value;
    }

    return `${value}${mockSuffix}`;
  }
}
