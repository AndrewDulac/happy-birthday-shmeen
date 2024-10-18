module.exports = {
  apps: [
    {
      name: 'vue-app',
      script: 'serve',
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: 'frontend/dist',
        PM2_SERVE_PORT: 3001,
      }
    },
    {
      name: 'node-app',
      script: 'backend/src/app.js',
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: 4000,
        LOCAL_FRONTEND_URL: 'http://localhost:3001',
      }
    }
  ]
};