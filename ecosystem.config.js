module.exports = {
  apps: [
    {
      name: 'cred2tech-audit-portal',
      script: 'server.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 5000,
      max_memory_restart: '512M',
    },
  ],
};
