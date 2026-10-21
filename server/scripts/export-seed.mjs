// Web ilovadagi maqolalarni (src/data/articles.js) prisma/seed-data.json ga eksport qiladi.
// Maqolalar o'zgarganda ishlatiladi: npm run seed:export
import { build } from 'esbuild'
import { writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const web = path.resolve(here, '../../src/data')
const out = path.join(here, '.seed-bundle.mjs')

await build({
  stdin: {
    contents: `
      export { ARTICLES } from './articles.js'
    `,
    resolveDir: web,
    loader: 'js',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react-dom/*', 'react/*', 'react-router-dom', '@phosphor-icons/react', 'react-icons', 'react-icons/*', 'leaflet'],
  define: { 'import.meta.env': '{}' },
  logLevel: 'error',
})

const data = await import(pathToFileURL(out).href)
const json = { articles: data.ARTICLES }
await writeFile(path.join(here, '../prisma/seed-data.json'), JSON.stringify(json, null, 2))
await rm(out)
console.log(`seed-data.json: ${json.articles.length} maqola`)
