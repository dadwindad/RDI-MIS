import { exec } from 'child_process';

const ports = [3801, 3802, 3803, 3805, 5173, 5174, 5175];

function findAndKill() {
  exec('netstat -ano', (err, stdout) => {
    if (err) {
      console.error('Failed to run netstat:', err);
      return;
    }

    const lines = stdout.split('\n');
    const pids = new Set();

    lines.forEach(line => {
      ports.forEach(port => {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            pids.add(parseInt(pid, 10));
          }
        }
      });
    });

    if (pids.size === 0) {
      console.log('No processes found running on ports', ports);
      return;
    }

    console.log('Found PIDs to kill:', Array.from(pids));
    pids.forEach(pid => {
      exec(`taskkill /F /PID ${pid}`, (kErr) => {
        if (kErr) {
          console.error(`Failed to kill process ${pid}:`, kErr.message);
        } else {
          console.log(`Killed process ${pid} successfully.`);
        }
      });
    });
  });
}

findAndKill();
