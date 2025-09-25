import type { VideoRow } from './store.local'

const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const YT_WATCH = (id: string) => `https://www.youtube.com/watch?v=${id}`

function text(el: Element | null, sel: string) {
	const n = el?.querySelector(sel)
	return n?.textContent?.trim() ?? ''
}

// try several patterns to find the 11-char video id
function extractVideoId(entry: Element): string | null {
	const idText = text(entry, 'id') // often "yt:video:VIDEOID"
	if (idText.includes(':')) {
		const last = idText.split(':').pop()!
		if (/^[a-zA-Z0-9_-]{11}$/.test(last)) return last
	}
	// some feeds have <yt:videoId>
	const ytid = text(entry, 'yt\\:videoId')
	if (/^[a-zA-Z0-9_-]{11}$/.test(ytid)) return ytid

	// try link href ?v=
	const linkHref = entry.querySelector('link')?.getAttribute('href')
	if (linkHref) {
		try {
			const u = new URL(linkHref)
			const v = u.searchParams.get('v')
			if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
		} catch {
			/* empty */
		}
	}
	return null
}

export async function fetchYouTubeUploads(
	channelId: string,
): Promise<VideoRow[]> {
	const res = await fetch(
		`/yt/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
	)
	if (!res.ok) throw new Error(`YouTube RSS failed: ${res.status}`)
	const xml = await res.text()

	const doc = new DOMParser().parseFromString(xml, 'application/xml')
	const entries = Array.from(doc.querySelectorAll('entry'))

	const rows: VideoRow[] = entries.map((entry) => {
		const id = extractVideoId(entry) ?? crypto.randomUUID()
		const title = text(entry, 'title') || '(untitled)'
		const publishedAt = text(entry, 'published') || new Date().toISOString()
		const description =
			text(entry, 'media\\:description') || text(entry, 'content')
		return {
			id,
			title,
			description,
			publishedAt,
			thumbnailUrl: YT_THUMB(id),
			externalUrl: YT_WATCH(id),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
	})

	return rows
}
