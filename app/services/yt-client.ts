// Thumbnails used across channel/playlist/video snippets
export interface YT_Thumbnails {
	default?: { url?: string }
	medium?: { url?: string }
	high?: { url?: string }
}

// Channel

export interface YT_ChannelSnippet {
	title?: string
	customUrl?: string
	localized?: { customUrl?: string }
	publishedAt?: string
	thumbnails?: YT_Thumbnails
	description?: string
	country?: string
}

export interface YT_ChannelStatistics {
	subscriberCount?: string | number
	viewCount?: string | number
	videoCount?: string | number
	hiddenSubscriberCount?: boolean
}

export interface YT_BrandingSettings {
	image?: { bannerExternalUrl?: string }
	channel?: {
		country?: string
		keywords?: string
		featuredChannelsUrls?: string[]
	}
}

export interface YT_Channel {
	id?: string
	snippet?: YT_ChannelSnippet
	statistics?: YT_ChannelStatistics
	brandingSettings?: YT_BrandingSettings
	contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

// Playlist

export interface YT_PlaylistSnippet {
	title?: string
	thumbnails?: YT_Thumbnails
}

export interface YT_PlaylistContentDetails {
	itemCount?: number
}

export interface YT_Playlist {
	id?: string
	snippet?: YT_PlaylistSnippet
	contentDetails?: YT_PlaylistContentDetails
}

// PlaylistItem (for uploads → video ids)
export interface YT_PlaylistItem {
	snippet?: { resourceId?: { videoId?: string } }
	contentDetails?: { videoId?: string }
}

// Video

export interface YT_VideoSnippet {
	title?: string
	publishedAt?: string
	thumbnails?: YT_Thumbnails
}

export interface YT_VideoStatistics {
	viewCount?: string | number
}

export interface YT_VideoContentDetails {
	duration?: string
}

export interface YT_Video {
	id?: string
	snippet?: YT_VideoSnippet
	statistics?: YT_VideoStatistics
	contentDetails?: YT_VideoContentDetails
}

// Generic page
export interface YT_Page<T> {
	items?: T[]
	nextPageToken?: string
	pageInfo?: { totalResults?: number; resultsPerPage?: number }
}

// Search result
export interface YT_SearchResult {
	id?: { videoId?: string } | string
	snippet?: Record<string, unknown>
}

const BASE = import.meta.env.VITE_YT_PROXY as string

function q(params: Record<string, string | number | undefined>) {
	const s = new URLSearchParams()
	for (const [k, v] of Object.entries(params))
		if (v != null) s.set(k, String(v))
	return s.toString()
}

async function jget<T>(
	path: string,
	params: Record<string, string | number | undefined>,
): Promise<T> {
	const url = `${BASE}/${path}?${q(params)}`
	const r = await fetch(url, { credentials: 'omit' })
	if (!r.ok) {
		const text = await r.text().catch(() => '')
		throw new Error(`GET ${path} failed: ${r.status} ${r.statusText}\n${text}`)
	}
	return r.json() as Promise<T>
}

// --- primitives (handle-first; no id in the route) ---
export async function resolveByHandle(handle: string): Promise<{
	channel: YT_Channel
	channelId: string
	uploadsId: string
}> {
	const data = await jget<YT_Page<YT_Channel>>('channels', {
		part: 'snippet,contentDetails,statistics,brandingSettings',
		forHandle: handle.startsWith('@') ? handle : `@${handle}`,
	})
	const item = data.items?.[0]
	if (!item) throw new Error(`Channel not found for handle ${handle}`)
	return {
		channel: item,
		channelId: String(item.id ?? ''),
		uploadsId: String(item.contentDetails?.relatedPlaylists?.uploads ?? ''),
	}
}

export async function listPlaylists(
	channelId: string,
	pageToken?: string,
): Promise<YT_Page<YT_Playlist>> {
	return jget<YT_Page<YT_Playlist>>('playlists', {
		part: 'snippet,contentDetails',
		channelId,
		maxResults: 50,
		pageToken,
	})
}

export async function listUploads(
	uploadsId: string,
	pageToken?: string,
): Promise<YT_Page<YT_PlaylistItem>> {
	return jget<YT_Page<YT_PlaylistItem>>('playlistItems', {
		part: 'snippet,contentDetails',
		playlistId: uploadsId,
		maxResults: 50,
		pageToken,
	})
}

export async function videosByIds(ids: string[]): Promise<YT_Page<YT_Video>> {
	if (!ids.length) return { items: [] }
	const chunks: string[][] = []
	for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))
	const pages = await Promise.all(
		chunks.map((chunk) =>
			jget<YT_Page<YT_Video>>('videos', {
				part: 'snippet,contentDetails,statistics',
				id: chunk.join(','),
			}),
		),
	)
	return { items: pages.flatMap((p) => p.items ?? []) }
}

export async function searchLive(
	channelId: string,
	eventType: 'live' | 'upcoming',
): Promise<YT_Page<YT_SearchResult>> {
	return jget<YT_Page<YT_SearchResult>>('search', {
		part: 'snippet',
		channelId,
		type: 'video',
		eventType,
		order: 'date',
		maxResults: 10,
	})
}

// --- high-level “bundle” for one page ---
export async function getChannelBundleByHandle(handle: string): Promise<{
	channel: YT_Channel
	channelId: string
	uploadsId: string
	playlists: YT_Page<YT_Playlist>
	uploads: YT_Page<YT_PlaylistItem>
	details: YT_Page<YT_Video>
	live: YT_Page<YT_SearchResult>
	upcoming: YT_Page<YT_SearchResult>
}> {
	// 1) channel + ids by handle (1 unit; cached)
	const { channel, channelId, uploadsId } = await resolveByHandle(handle)

	// 2) playlists + uploads (cheap; cached)
	const [playlists, uploads] = await Promise.all([
		listPlaylists(channelId),
		listUploads(uploadsId),
	])

	// 3) collect upload video IDs → bulk details (cheap; cached)
	const ids: string[] = (uploads.items ?? [])
		.map((it) => it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId)
		.filter((v): v is string => Boolean(v))

	const details = await videosByIds(ids.slice(0, 50))

	// 4) live + upcoming (expensive; cached ~10m by your function)
	const [live, upcoming] = await Promise.all([
		searchLive(channelId, 'live').catch(() => ({ items: [] })),
		searchLive(channelId, 'upcoming').catch(() => ({ items: [] })),
	])

	return {
		channel,
		channelId,
		uploadsId,
		playlists,
		uploads,
		details,
		live,
		upcoming,
	}
}
