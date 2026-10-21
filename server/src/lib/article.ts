// Maqola bloklari ↔ admin formadagi matn ("## Sarlavha", "- ro'yxat", paragraflar)
type Block = { h?: string; p?: string; list?: string[] }

export function articleBodyToText(body: unknown) {
  if (!Array.isArray(body)) return ''
  return (body as Block[])
    .map((b) => (b.h ? `## ${b.h}` : b.list ? b.list.map((x) => `- ${x}`).join('\n') : b.p || ''))
    .join('\n\n')
}
