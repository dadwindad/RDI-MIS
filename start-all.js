import { spawn } from 'child_process';
import path from 'path';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const services = [
  { name: 'CORE-BE', command: npmCmd, args: ['run', 'server'], cwd: process.cwd() },
  { name: 'CORE-FE', command: npmCmd, args: ['run', 'dev'], cwd: process.cwd() },
  { name: 'PMS-BE ', command: npmCmd, args: ['start'], cwd: path.join(process.cwd(), 'sub-apps', 'pms-app') }
];

console.log('Starting all services...');

services.forEach(service => {
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: true
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${service.name}] ${line.trim()}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`[${service.name}] ${line.trim()}`);
      }
    });
  });

  proc.on('close', (code) => {
    console.log(`[${service.name}] process exited with code ${code}`);
  });
});
