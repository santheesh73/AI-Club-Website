import { build } from 'vite';
import { gzipSync } from 'node:zlib';

// Match the release launcher, even when the shared root .env is for development.
process.env.NODE_ENV = 'production';

// Measure the code an initial page visit downloads, including static shared imports.
const result = await build({
  logLevel: 'error',
  build: { write: false },
});

// Inspect returned output after Vite finishes its preload and asset transforms.
for (const output of (Array.isArray(result) ? result : [result])) {
  const bundle = Object.fromEntries(output.output.map(file => [file.fileName, file]));
  const allModules = output.output.filter(file => file.type === 'chunk')
    .flatMap(chunk => Object.entries(chunk.modules));
  if (allModules.some(([id, module]) => /react(?:-dom)?\/.*development\.js$/.test(id) && module.renderedLength > 0)) {
    throw new Error('Production build contains a development React runtime. Check NODE_ENV before release.');
  }
  for (const entry of Object.values(bundle).filter(file => file.type === 'chunk' && file.isEntry)) {
    const initialChunks = new Map();
    const visit = chunk => {
      if (initialChunks.has(chunk.fileName)) return;
      initialChunks.set(chunk.fileName, chunk);
      for (const name of chunk.imports) if (bundle[name]?.type === 'chunk') visit(bundle[name]);
    };
    visit(entry);
    const chunks = [...initialChunks.values()];
    if (chunks.some(chunk => Object.keys(chunk.modules).some(id => /\/(?:Applicant|Member|Admin)Layout\.tsx$/.test(id)))) {
      throw new Error('A private workspace layout is included in the initial public-page bundle.');
    }
    console.log(JSON.stringify({
      entry: entry.fileName,
      initialJavaScriptBytes: chunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0),
      initialGzipBytes: chunks.reduce((total, chunk) => total + gzipSync(chunk.code).length, 0),
      chunks: chunks.map(chunk => ({ file: chunk.fileName, bytes: Buffer.byteLength(chunk.code) })),
      largestInitialModules: chunks.flatMap(chunk => Object.entries(chunk.modules))
        .sort((a, b) => b[1].renderedLength - a[1].renderedLength).slice(0, 15)
        .map(([id, module]) => ({ id: id.replace(process.cwd().replaceAll('\\', '/'), '.'), bytes: module.renderedLength })),
    }, null, 2));
  }
}
