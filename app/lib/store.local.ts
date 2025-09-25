export type VideoRow = {
	id: string
	title: string
	description?: string | null
	publishedAt: string // ISO
	thumbnailUrl: string
	externalUrl: string
	createdAt: string // ISO
	updatedAt: string // ISO
}

const KEY = 'videos.v1'

export function loadVideos(): VideoRow[] {
	try {
		const raw = localStorage.getItem(KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw) as { videos: VideoRow[] }
		return parsed?.videos ?? []
	} catch {
		return []
	}
}

export function saveVideos(videos: VideoRow[]) {
	localStorage.setItem(KEY, JSON.stringify({ videos }))
}

export function upsertVideos(incoming: VideoRow[]) {
	const now = new Date().toISOString()
	const map = new Map<string, VideoRow>()
	for (const v of loadVideos()) map.set(v.id, v)

	let inserted = 0,
		updated = 0,
		skipped = 0

	for (const v of incoming) {
		const ex = map.get(v.id)
		if (!ex) {
			map.set(v.id, { ...v, createdAt: now, updatedAt: now })
			inserted++
		} else if (ex.title !== v.title || ex.thumbnailUrl !== v.thumbnailUrl) {
			map.set(v.id, { ...ex, ...v, updatedAt: now })
			updated++
		} else {
			skipped++
		}
	}

	const all = [...map.values()].sort(
		(a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
	)
	saveVideos(all)
	return { inserted, updated, skipped, total: all.length }
}
