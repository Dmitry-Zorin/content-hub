import type { LoaderFunctionArgs } from 'react-router'
import Parser from 'rss-parser'
import { upsertVideos, type VideoRow } from '~/lib/store.file.server'

const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const YT_WATCH = (id: string) => `https://www.youtube.com/watch?v=${id}`

function getChannelId(url: URL) {
	// allow override via ?channel=... or fall back to env
	const q = url.searchParams.get('channel')
	return q || process.env.YOUTUBE_CHANNEL_ID || ''
}

function extractVideoId(item: any): string | null {
	if (item.id && typeof item.id === 'string' && item.id.includes(':')) {
		const last = item.id.split(':').pop()!
		if (/^[a-zA-Z0-9_-]{11}$/.test(last)) return last
	}
	if (item['yt:videoId'] && /^[a-zA-Z0-9_-]{11}$/.test(item['yt:videoId'])) {
		return item['yt:videoId']
	}
	try {
		if (item.link) {
			const u = new URL(item.link)
			const v = u.searchParams.get('v')
			if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
		}
	} catch {}
	return null
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const channelId = getChannelId(url)
	if (!channelId) {
		return new Response(
			'Missing channel id (?channel= or YOUTUBE_CHANNEL_ID)',
			{ status: 400 },
		)
	}

	const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
	const parser = new Parser({
		customFields: {
			item: [
				['yt:videoId', 'yt:videoId', { keepArray: false }],
				['media:group', 'media:group', { keepArray: false }],
			],
		},
	})

	const feed = await parser.parseURL(feedUrl)
	const incoming: VideoRow[] = []

	for (const item of feed.items ?? []) {
		const id = extractVideoId(item)
		if (!id) continue

		incoming.push({
			id,
			title: item.title ?? '(untitled)',
			description: (item.contentSnippet ?? item.summary ?? '')
				?.toString()
				.slice(0, 2000),
			publishedAt:
				item.isoDate ?
					new Date(item.isoDate).toISOString()
				:	new Date().toISOString(),
			thumbnailUrl: YT_THUMB(id),
			externalUrl: YT_WATCH(id),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		})
	}

	const res = await upsertVideos(incoming)
	return Response.json({ ok: true, feedTitle: feed.title, ...res })
}
