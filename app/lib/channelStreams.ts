// src/lib/channelStreams.ts
// Returns *past live* videos (VODs) from a channel's Streams/Live tab (no API key).
// It fetches the HTML via your Vite proxy and parses the page's ytInitialData JSON.

export type StreamVOD = {
	videoId: string
	title: string
	publishedText?: string // e.g., "Streamed 2 days ago"
	viewCountText?: string // e.g., "12,345 views"
	thumbnailUrl: string // best available
	url: string // https://www.youtube.com/watch?v=VIDEO_ID
}

const WATCH = (id: string) => `https://www.youtube.com/watch?v=${id}`
const THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

function extractYtInitialData(html: string): any | null {
	// Try two assignments variants: "var ytInitialData =" or "window[\"ytInitialData\"] ="
	let m = html.match(/ytInitialData\s*=\s*({[\s\S]*?});/)
	if (!m)
		m = html.match(/window\[(?:'|")ytInitialData(?:'|")\]\s*=\s*({[\s\S]*?});/)
	if (!m) return null
	try {
		return JSON.parse(m[1])
	} catch {
		return null
	}
}

function dig<T = any>(obj: any, path: (string | number)[]): T | undefined {
	return path.reduce<any>(
		(acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
		obj,
	)
}

/** YouTube often nests streams in a Rich Grid under the Streams/Live tab. */
function collectVideoRenderers(yt: any): any[] {
	// The Live/Streams tab content is usually under:
	// contents.twoColumnBrowseResultsRenderer.tabs[].tabRenderer.content.richGridRenderer.contents[]
	const tabs =
		dig<any[]>(yt, ['contents', 'twoColumnBrowseResultsRenderer', 'tabs']) ?? []
	const renderers: any[] = []

	for (const t of tabs) {
		const tab = t?.tabRenderer
		if (!tab) continue

		// Heuristic: title "Live" or "Streams" or "Videos" for some locales
		const title = tab.title?.toLowerCase?.() ?? ''
		const looksLikeStreamsTab =
			['live', 'streams'].some((s) => title.includes(s)) || !!tab.selected

		const contents =
			dig<any[]>(tab, ['content', 'richGridRenderer', 'contents']) ?? []
		for (const it of contents) {
			const vr =
				it?.richItemRenderer?.content?.videoRenderer ??
				it?.richItemRenderer?.content?.reelItemRenderer // shorts fallback
			if (vr) renderers.push(vr)
		}

		// Some layouts put a shelfRenderer → content → richItemRenderer
		const sections =
			dig<any[]>(tab, ['content', 'sectionListRenderer', 'contents']) ?? []
		for (const sec of sections) {
			const sl = sec?.itemSectionRenderer?.contents ?? []
			for (const child of sl) {
				const shelf =
					child?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items ??
					[]
				for (const item of shelf) {
					const vr =
						item?.videoRenderer ??
						item?.richItemRenderer?.content?.videoRenderer
					if (vr) renderers.push(vr)
				}
			}
		}

		if (looksLikeStreamsTab && renderers.length) break // good enough
	}
	return renderers
}

function toVOD(vr: any): StreamVOD | null {
	const videoId = vr?.videoId
	if (!videoId) return null
	const title = vr?.title?.runs?.[0]?.text ?? '(untitled)'
	const viewCountText =
		vr?.viewCountText?.simpleText ??
		vr?.viewCountText?.runs?.map((r: any) => r.text).join('') ??
		undefined
	const publishedText =
		vr?.publishedTimeText?.simpleText ??
		vr?.publishedTimeText?.runs?.map((r: any) => r.text).join('') ??
		undefined
	return {
		videoId,
		title,
		viewCountText,
		publishedText,
		thumbnailUrl: THUMB(videoId),
		url: WATCH(videoId),
	}
}

/** Try /channel/{id}/streams first, then /@handle/streams. */
async function fetchStreamsHtml(channelIdOrHandle: string): Promise<string> {
	const isHandle = channelIdOrHandle.startsWith('@')
	const paths =
		isHandle ?
			[`/yt/${channelIdOrHandle}/streams`]
		:	[
				`/yt/channel/${channelIdOrHandle}/streams`,
				`/yt/@${channelIdOrHandle}/streams`,
			]

	for (const p of paths) {
		const res = await fetch(p, { method: 'GET' })
		if (res.ok) return await res.text()
	}
	throw new Error('Streams tab not accessible')
}

/** Public API: get past live videos (VODs) from the Streams/Live tab. */
export async function listChannelLiveVODs(
	channelIdOrHandle: string,
	limit = 24,
): Promise<StreamVOD[]> {
	const html = await fetchStreamsHtml(channelIdOrHandle)
	const yt = extractYtInitialData(html)
	if (!yt) return []

	const renderers = collectVideoRenderers(yt)
	const vods: StreamVOD[] = []
	for (const vr of renderers) {
		const v = toVOD(vr)
		if (v) vods.push(v)
		if (vods.length >= limit) break
	}
	return vods
}
