import { exec } from 'child_process';

exec('netstat -ano | findstr :3805', (err, stdout, stderr) => {
  if (err || !stdout) {
    console.log('No process found on port 3805 or error occurred.');
    return;
  }
  
  const lines = stdout.trim().split('\n');
  const pids = new Set();
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      pids.add(pid);
    }
  });
  
  pids.forEach(pid => {
    console.log(`Killing PID: ${pid}`);
    exec(`taskkill /F /PID ${pid}`, (kErr, kStdout, kStderr) => {
      if (kErr) console.error(`Failed to kill ${pid}:`, kErr.message);
      else console.log(`Killed ${pid} successfully.`);
    });
  });
});
