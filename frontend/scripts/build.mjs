// Set this before Vite resolves configuration and the shared backend .env.
// A successful release build must never ship development React or demo grants.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
