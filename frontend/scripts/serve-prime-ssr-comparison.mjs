import { startSeoStaticServer } from './seo-static-server.mjs';

// The reference is copied from ng build output BEFORE postprocessing, never
// reconstructed from transformed CSS. Both servers use the very same JS build.
const reference = await startSeoStaticServer({
  buildDir: process.env.PRIME_SSR_REFERENCE_DIR || 'dist/prime-ssr-inline',
  host: '127.0.0.1', port: 4257,
});
const candidate = await startSeoStaticServer({ host: '127.0.0.1', port: 4256 });
console.log(`PrimeNG SSR comparison: ${reference.baseUrl} -> ${candidate.baseUrl}`);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (stopping) return;
  stopping = true;
  await Promise.all([reference.close(), candidate.close()]);
  process.exit(0);
});
