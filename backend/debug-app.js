const { createApp } = require('./src/app');
try {
  console.log('Attempting to create app...');
  const app = createApp();
  console.log('App created successfully!');
  process.exit(0);
} catch (err) {
  console.error('Failed to create app:', err);
  process.exit(1);
}
