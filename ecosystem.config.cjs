const instances = process.env.PM2_INSTANCES || '2';

module.exports = {
  apps: [
    {
      name: 'singa-pen-api',
      script: './dist-server/server.mjs',
      exec_mode: 'cluster',
      instances,
      autorestart: true,
      max_memory_restart: '500M',
      kill_timeout: Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT_MS || 15000),
      listen_timeout: 10000,
      exp_backoff_restart_delay: 1000,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
