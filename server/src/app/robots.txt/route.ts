// API va admin panel domeni qidiruv tizimlarida ko'rinmasin (sayt domenining robots.txt'i alohida)
export function GET() {
  return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
