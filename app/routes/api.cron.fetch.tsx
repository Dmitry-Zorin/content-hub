import { eq } from 'drizzle-orm'
import { URL } from 'node:url'
import type { LoaderFunctionArgs } from 'react-router'
import Parser from 'rss-parser'
import { db } from '~/db/client.server'
import { videos } from '~/db/schema'

// Optional but recommended: require a secret header
function assertCronSecret(request: Request) {
	const secret = request.headers.get('x-cron-secret')
	if (!secret || secret !== process.env.CRON_SECRET) {
		throw new Response('Unauthorized', { status: 401 })
	}
}

const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const YT_WATCH = (id: string) => `https://www.youtube.com/watch?v=${id}`

function extractVideoId(item: any): string | null {
	if (item.id && typeof item.id === 'string' && item.id.includes(':')) {
		const parts = item.id.split(':')
		const last = parts[parts.length - 1]
		if (/^[a-zA-Z0-9_-]{11}$/.test(last)) return last
	}
	if (item.link) {
		try {
			const u = new URL(item.link)
			const v = u.searchParams.get('v')
			if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
		} catch {}
	}
	if (item['yt:videoId'] && /^[a-zA-Z0-9_-]{11}$/.test(item['yt:videoId'])) {
		return item['yt:videoId']
	}
	return null
}

export async function loader({ request }: LoaderFunctionArgs) {
	assertCronSecret(request)

	const channelId = process.env.YOUTUBE_CHANNEL_ID!
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

	let inserted = 0,
		updated = 0,
		skipped = 0

	for (const item of feed.items ?? []) {
		const id = extractVideoId(item)
		if (!id) {
			skipped++
			continue
		}

		const title = item.title ?? '(untitled)'
		const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date()
		const externalUrl = YT_WATCH(id)
		const thumbnailUrl = YT_THUMB(id)
		const description = (item.contentSnippet ?? item.summary ?? '')
			.toString()
			.slice(0, 2000)

		const existing = await db
			.select()
			.from(videos)
			.where(eq(videos.id, id))
			.limit(1)
		if (existing.length === 0) {
			await db.insert(videos).values({
				id,
				title,
				description,
				publishedAt,
				thumbnailUrl,
				externalUrl,
			})
			inserted++
		} else {
			const ex = existing[0]
			if (ex?.title !== title || ex.thumbnailUrl !== thumbnailUrl) {
				await db
					.update(videos)
					.set({ title, thumbnailUrl, updatedAt: new Date() })
					.where(eq(videos.id, id))
				updated++
			} else {
				skipped++
			}
		}
	}

	return Response.json({ ok: true, inserted, updated, skipped })
}
