module.exports = {
  apps: [
    {
      name: 'cred2tech-audit-portal',
      script: 'server.js',
      cwd: __dirname,
      env_production: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/cred2tech-audit-portal-error.log',
      out_file: '/var/log/pm2/cred2tech-audit-portal-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      // Give the SIGTERM/SIGINT handler time to await live.stop()/pool.end()
      // before PM2 force-kills with SIGKILL — matches nestjs-backend's and
      // audit-log-shipper's ecosystem.config.js convention.
      kill_timeout: 5000,
      // Wait for process.send('ready') (sent once the HTTP server is
      // actually listening) before marking online during pm2 reload.
      wait_ready: true,
      listen_timeout: 15000,
    },
  ],
};
