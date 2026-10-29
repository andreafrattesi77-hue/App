import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServer = path.resolve(__dirname, 'dist', 'server.js');

if (process.env.NODE_ENV === 'production' && fs.existsSync(distServer)) {
  // @ts-ignore
  await import('./dist/server.js');
} else {
  // @ts-ignore
  await import('./server-app.ts');
}
