// Web ilovadagi demo ma'lumotlarni (src/data) prisma/seed-data.json ga eksport qiladi.
// Faqat bir marta yoki web ilovadagi demo ma'lumotlar o'zgarganda ishlatiladi: npm run seed:export
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
      export { JOBS, COURSES, EVENTS } from './mock.js'
      export { ARTICLES } from './articles.js'
      export { COMPANY_INFO } from './companies.js'
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
const json = {
  jobs: data.JOBS,
  courses: data.COURSES,
  events: data.EVENTS,
  articles: data.ARTICLES,
  companies: data.COMPANY_INFO,
}
await writeFile(path.join(here, '../prisma/seed-data.json'), JSON.stringify(json, null, 2))
await rm(out)
console.log(`seed-data.json: ${json.jobs.length} vakansiya, ${json.courses.length} kurs, ${json.articles.length} maqola, ${json.events.length} tadbir`)
