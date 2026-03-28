#!/usr/bin/env node

import { spawn } from 'child_process';

function resolveBin(name) {
  if (process.platform === 'win32') return `${name}.cmd`;
  return name;
}

function runStep(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: options.stdio ?? 'inherit',
      shell: options.shell ?? process.platform === 'win32',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited via signal ${signal}`));
        return;
      }
      if ((code ?? 0) !== 0) {
        reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
        return;
      }
      resolve(child);
    });
  });
}

function parseArg(name, fallback) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const host = parseArg('host', process.env.PLAYWRIGHT_HOST || '127.0.0.1');
const port = parseArg('port', process.env.PLAYWRIGHT_PORT || '4200');

await runStep(resolveBin('npm'), ['run', 'gen:data']);

const ngServe = spawn(
  resolveBin('npx'),
  ['ng', 'serve', '--configuration', 'development', '--host', host, '--port', String(port)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  },
);

let shuttingDown = false;

const terminateChild = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!ngServe.killed) {
    ngServe.kill(signal);
  }
};

process.on('SIGINT', () => terminateChild('SIGINT'));
process.on('SIGTERM', () => terminateChild('SIGTERM'));
process.on('SIGHUP', () => terminateChild('SIGHUP'));

ngServe.once('error', (error) => {
  console.error('[start:e2e-server] failed to launch ng serve');
  console.error(error);
  process.exit(1);
});

ngServe.once('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
    return;
  }
  process.exit(code ?? 0);
});
