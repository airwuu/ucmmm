import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  if (!target) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 });
  }
  try {
    const decoded = decodeURIComponent(target);
    // basic allowlist: only dining.ucmerced.edu images
    const allowHost = /dining\.ucmerced\.edu$/i;
    const host = new URL(decoded).host;
    if (!allowHost.test(host)) {
      return NextResponse.json({ error: 'forbidden_host', host }, { status: 403 });
    }
    const upstream = await fetch(decoded, { headers: { 'User-Agent': 'ucmmm-proxy/1.0' } });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'upstream_error', status: upstream.status }, { status: 502 });
    }
    const arrayBuf = await upstream.arrayBuffer();
    // Infer content type
    const ct = upstream.headers.get('content-type') || 'image/png';
    return new NextResponse(Buffer.from(arrayBuf), {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'proxy_failed', message: e?.message }, { status: 500 });
  }
}
