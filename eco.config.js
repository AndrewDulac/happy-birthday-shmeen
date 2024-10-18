module.exports = {
  apps: [
    {
      name: 'vue-app',
      script: 'serve',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: 'frontend/dist',
        PM2_SERVE_PORT: process.env.FRONTEND_PORT,
      }
    },
    {
      name: 'node-app',
      script: 'backend/src/app.js',
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: process.env.BACKEND_PORT,
        LOCAL_FRONTEND_URL: process.env.LOCAL_FRONTEND_URL,
      }
    }
  ]
};