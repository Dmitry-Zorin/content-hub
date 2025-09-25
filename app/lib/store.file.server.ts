import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const DATA_DIR = join(process.cwd(), '.data')
const VIDEOS_PATH = join(DATA_DIR, 'videos.json')

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

type VideosFile = { videos: VideoRow[] }

async function ensureDir(path: string) {
	if (!existsSync(path)) await mkdir(path, { recursive: true })
}

export async function loadVideos(): Promise<VideoRow[]> {
	if (!existsSync(VIDEOS_PATH)) return []
	const buf = await readFile(VIDEOS_PATH, 'utf8')
	try {
		const json = JSON.parse(buf) as VideosFile
		return json.videos ?? []
	} catch {
		return []
	}
}

export async function saveVideos(rows: VideoRow[]): Promise<void> {
	await ensureDir(dirname(VIDEOS_PATH))
	const payload: VideosFile = { videos: rows }
	await writeFile(VIDEOS_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

/** upsert by id, returns {inserted, updated, skipped} */
export async function upsertVideos(incoming: VideoRow[]) {
	const now = new Date().toISOString()
	const map = new Map<string, VideoRow>()
	;(await loadVideos()).forEach((v) => map.set(v.id, v))

	let inserted = 0,
		updated = 0,
		skipped = 0
	for (const v of incoming) {
		const existing = map.get(v.id)
		if (!existing) {
			map.set(v.id, { ...v, createdAt: now, updatedAt: now })
			inserted++
		} else {
			// update title/thumbnail if changed
			if (
				existing.title !== v.title ||
				existing.thumbnailUrl !== v.thumbnailUrl
			) {
				map.set(v.id, { ...existing, ...v, updatedAt: now })
				updated++
			} else {
				skipped++
			}
		}
	}

	// keep newest first
	const all = [...map.values()].sort(
		(a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
	)
	await saveVideos(all)
	return { inserted, updated, skipped, total: all.length }
}
