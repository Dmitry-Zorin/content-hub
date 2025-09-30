import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js'

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const ALLOWED_ORIGINS: [string, ...string[]] = ['http://localhost:5173']

const YT_KEY = Deno.env.get('YT_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE = Deno.env.get('SERVICE_ROLE_KEY') ?? ''

if (!YT_KEY) throw new Error('Missing env: YT_KEY')
if (!URL) throw new Error('Missing env: SUPABASE_URL')
if (!SERVICE_ROLE) throw new Error('Missing env: SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
	auth: { persistSession: false },
})

function corsHeaders(origin: string | null) {
	const allow =
		origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

	return {
		'Access-Control-Allow-Origin': allow,
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers':
			'authorization, x-client-info, apikey, content-type, x-youtube-handle',
		Vary: 'Origin, X-YouTube-Handle',
	}
}

function ttlFor(pathname: string): number {
	if (pathname.endsWith('/search')) return 60 * 60 * 1000
	if (pathname.endsWith('/videos')) return 60 * 60 * 1000
	if (pathname.endsWith('/playlistItems')) return 60 * 60 * 1000
	if (pathname.endsWith('/playlists')) return 6 * 60 * 60 * 1000
	if (pathname.endsWith('/channels')) return 6 * 60 * 60 * 1000
	return 60 * 60 * 1000
}

// NEW: helpers for safe, stable cache keys
function stableParams(params: URLSearchParams, skip = new Set(['key'])) {
	return [...params.entries()]
		.filter(([k]) => !skip.has(k))
		.sort(([a], [b]) =>
			a < b ? -1
			: a > b ? 1
			: 0,
		)
		.map(([k, v]) => `${k}=${v}`)
		.join('&')
}

function cacheKeyForRequest(
	endpoint: string,
	params: URLSearchParams,
	handle: string | null,
) {
	const base = `${endpoint}?${stableParams(params)}`
	return `${base}::handle=${handle ?? ''}`
}

function buildYouTubeUrl(endpoint: string, query: URLSearchParams): string {
	const url = new URL(`${API_BASE}/${endpoint}`)
	for (const [k, v] of query.entries()) {
		if (k === 'handle') continue // don't send synthetic param to YouTube
		url.searchParams.set(k, v)
	}
	url.searchParams.set('key', YT_KEY)
	return url.toString()
}

async function getCache(key: string) {
	const { data, error } = await supabase
		.from('api_cache')
		.select('body, etag, content_type, cached_at, ttl_ms')
		.eq('key', key)
		.maybeSingle()
	if (error) throw error
	return data as {
		body: unknown
		etag: string | null
		content_type: string | null
		cached_at: string
		ttl_ms: number
	} | null
}

async function putCache(row: {
	key: string
	body: unknown
	etag: string | null
	content_type: string | null
	ttl_ms: number
}) {
	const { error } = await supabase.from('api_cache').upsert({
		key: row.key,
		body: row.body,
		etag: row.etag ?? null,
		content_type: row.content_type ?? 'application/json',
		cached_at: new Date().toISOString(),
		ttl_ms: row.ttl_ms,
	})
	if (error) throw error
}

function isFresh(hit: { cached_at: string; ttl_ms: number } | null): boolean {
	if (!hit) return false
	const ageMs = Date.now() - new Date(hit.cached_at).getTime()
	return ageMs < hit.ttl_ms
}

function asBodyString(body: unknown, contentType: string | null) {
	if (!contentType || contentType.includes('application/json'))
		return JSON.stringify(body)
	return String(body)
}

Deno.serve(async (req: Request) => {
	const origin = req.headers.get('Origin')

	if (req.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders(origin) })
	}

	try {
		const url = new URL(req.url)

		// Path: /yt-cache/<endpoint>
		const endpoint = url.pathname.split('/').pop() || ''

		const allowed = new Set([
			'videos',
			'channels',
			'playlists',
			'playlistItems',
			'search',
		])

		if (!allowed.has(endpoint)) {
			return new Response('Endpoint not allowed', {
				status: 403,
				headers: { ...corsHeaders(origin), 'Content-Type': 'text/plain' },
			})
		}

		const handle =
			url.searchParams.get('handle') ??
			req.headers.get('x-youtube-handle') ??
			null

		const upstreamUrl = buildYouTubeUrl(endpoint, url.searchParams)
		const cacheKey = cacheKeyForRequest(endpoint, url.searchParams, handle)
		const ttl = ttlFor(new URL(upstreamUrl).pathname)

		const hit = await getCache(cacheKey)
		if (hit && isFresh(hit)) {
			return new Response(
				asBodyString(hit.body, hit.content_type ?? 'application/json'),
				{
					headers: {
						...corsHeaders(origin),
						'Content-Type': hit.content_type ?? 'application/json',
						'X-Cache': 'HIT',
					},
				},
			)
		}

		const headers: HeadersInit = {}
		if (hit?.etag) headers['If-None-Match'] = hit.etag

		const upstream = await fetch(upstreamUrl, { headers })

		if (upstream.status === 304 && hit) {
			await putCache({
				key: cacheKey,
				body: hit.body,
				etag: hit.etag ?? null,
				content_type: hit.content_type ?? 'application/json',
				ttl_ms: ttl,
			})
			return new Response(
				asBodyString(hit.body, hit.content_type ?? 'application/json'),
				{
					headers: {
						...corsHeaders(origin),
						'Content-Type': hit.content_type ?? 'application/json',
						'X-Cache': 'REVALIDATED',
					},
				},
			)
		}

		const raw = await upstream.text()
		const contentType =
			upstream.headers.get('content-type') ?? 'application/json'

		if (!upstream.ok) {
			return new Response(raw, {
				status: upstream.status,
				headers: { ...corsHeaders(origin), 'Content-Type': contentType },
			})
		}

		const body: unknown =
			contentType.includes('application/json') ? JSON.parse(raw) : raw
		const etag = upstream.headers.get('etag')

		await putCache({
			key: cacheKey,
			body,
			etag,
			content_type: contentType,
			ttl_ms: ttl,
		})

		return new Response(asBodyString(body, contentType), {
			headers: {
				...corsHeaders(origin),
				'Content-Type': contentType,
				'X-Cache': hit ? 'MISS-REFETCH' : 'MISS',
			},
		})
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: 'edge_failed',
				message: String(e instanceof Error ? e.message : e),
			}),
			{
				status: 500,
				headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
			},
		)
	}
})
