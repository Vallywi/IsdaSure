const { spawn } = require('child_process');
const { spawnSync } = require('child_process');

const tasks = [];
let shuttingDown = false;
const isWindows = process.platform === 'win32';

function quoteArg(arg) {
  return /[\s"]/u.test(arg) ? `"${arg.replace(/"/gu, '\\"')}"` : arg;
}

function run(name, command, args) {
  const child = isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', `${command} ${args.map(quoteArg).join(' ')}`], {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
    : spawn(command, args, {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

  tasks.push({ name, child });

  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      console.error(`\n[${name}] exited with code ${code}. Stopping all tasks...`);
      shutdown(code || 1);
    }
  });

  return child;
}

function shutdown(exitCode = 0) {
  shuttingDown = true;

  for (const task of tasks) {
    if (!task.child.killed) {
      task.child.kill();
    }
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Starting single-server dev mode...');
console.log('Frontend build watcher: frontend/dist');
console.log('Backend server: http://localhost:4000');

const initialBuild = isWindows
  ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm --prefix frontend run build'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
  : spawnSync('npm', ['--prefix', 'frontend', 'run', 'build'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

if (initialBuild.status !== 0) {
  console.error('\nInitial frontend build failed. Single-server dev mode was not started.');
  process.exit(initialBuild.status || 1);
}

run('frontend-watch', 'npm', ['run', 'build:frontend:watch']);
run('backend-dev', 'npm', ['--prefix', 'backend', 'run', 'dev']);
