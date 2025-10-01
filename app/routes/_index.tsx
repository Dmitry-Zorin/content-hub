import * as React from 'react'
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { ExternalLink } from '~/components/external-link'
import {
	getChannelBundleByHandle,
	type YT_Channel,
	type YT_Playlist,
	type YT_Video,
} from '~/services/yt-client'

export interface HomeData {
	channel: {
		title: string
		handle: string
		subscriberCount: number
		viewCount: number
		videoCount: number
		publishedAt: string // ISO
		isLive: boolean
		description: string
		avatarUrl: string
		bannerUrl?: string
		country?: string
		keywords?: string
		featuredChannels?: string[]
	}
	videos: UiVideo[]
	playlists: UiPlaylist[]
}

export interface UiVideo {
	id: string
	title: string
	thumbnailUrl: string
	duration: string // H:MM:SS
	viewCount: number
	publishedAt: string // ISO
}

export interface UiPlaylist {
	id: string
	title: string
	thumbnailUrl: string
	count: number
}

function cx(...s: (string | false | undefined)[]) {
	return s.filter(Boolean).join(' ')
}
const nf = new Intl.NumberFormat()
const fmt = (n: number | string) => (typeof n === 'number' ? nf.format(n) : n)

// Encode an SVG string for safe use in CSS url("data:image/svg+xml;...")
function svgDataUrl(svg: string): string {
	const encoded = encodeURIComponent(svg)
	return `url('data:image/svg+xml;utf8,${encoded}')`
}

function YouTubeGlyph(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			aria-hidden
			className={cx('h-4 w-4', props.className)}
		>
			<path
				d="M23.5 6.6a4 4 0 0 0-2.8-2.8C18.9 3.2 12 3.2 12 3.2s-6.9 0-8.7.6A4 4 0 0 0 .5 6.6 41 41 0 0 0 0 12a41 41 0 0 0 .5 5.4 4 4 0 0 0 2.8 2.8c1.8.6 8.7.6 8.7.6s6.9 0 8.7-.6a4 4 0 0 0 2.8-2.8A41 41 0 0 0 24 12a41 41 0 0 0-.5-5.4Z"
				fill="currentColor"
				opacity=".9"
			/>
			<path d="M9.75 15.02V8.98L15.5 12l-5.75 3.02Z" fill="#fff" />
		</svg>
	)
}

function AccentNoiseBackground() {
	const noiseSvg = React.useMemo(
		() =>
			`<svg xmlns="http://w3.org/2000/svg" viewBox="0 0 100 100">` +
			`<filter id="n">` +
			`<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>` +
			`<feColorMatrix type="saturate" values="0"/>` +
			`</filter>` +
			`<rect width="100%" height="100%" filter="url(#n)" opacity="0.6"/>` +
			`</svg>`,
		[],
	)
	const noiseUrl = React.useMemo(() => svgDataUrl(noiseSvg), [noiseSvg])
	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 -z-10"
			style={{
				background:
					`radial-gradient(1200px 600px at 10% 10%, hsl(145 65% 62% / 0.18), transparent 60%),` +
					`radial-gradient(900px 400px at 90% 0%, hsl(160 80% 75% / 0.15), transparent 55%),` +
					`radial-gradient(1000px 500px at 50% 100%, hsl(140 60% 55% / 0.20), transparent 55%),` +
					`linear-gradient(180deg, hsl(210 30% 8%), hsl(210 30% 7%))`,
				maskImage:
					'radial-gradient(150% 150% at 50% 0%, black 60%, transparent 100%)',
			}}
		>
			<div
				className="absolute inset-0 opacity-20 mix-blend-overlay"
				style={{ backgroundImage: noiseUrl, backgroundSize: '300px 300px' }}
			/>
		</div>
	)
}

function GlassCard({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={cx(
				'rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white md:p-6',
				'shadow-sm shadow-black/20 backdrop-blur-xl',
				'transition-colors hover:border-white/20',
				className,
			)}
		>
			{children}
		</div>
	)
}

function Thumb({ video }: { video: UiVideo }) {
	return video.thumbnailUrl ?
			<img
				src={video.thumbnailUrl}
				alt={video.title}
				className="h-full w-full overflow-hidden rounded-lg object-cover"
				loading="lazy"
			/>
		:	<div className="h-full w-full bg-gradient-to-br from-emerald-500 to-lime-400" />
}

function VideoCard({ video }: { video: UiVideo }) {
	const published = new Date(video.publishedAt).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	})
	return (
		<ExternalLink
			aria-label={video.title}
			href={`https://youtube.com/watch?v=${video.id}`}
			className={cx(
				'group relative block focus:outline-none',
				'rounded-2xl ring-0 focus-visible:ring-2 focus-visible:ring-emerald-400/70',
			)}
		>
			<GlassCard className="h-full p-3 md:p-4">
				<div className="relative">
					<Thumb video={video} />
					<span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
						{video.duration}
					</span>
				</div>
				<div className="mt-3 flex items-start gap-3">
					<div>
						<h3 className="line-clamp-2 text-sm font-semibold text-white/95 group-hover:text-white">
							{video.title.trim()}
						</h3>
						<p className="mt-1 text-xs text-white/70">
							{fmt(video.viewCount)} views • {published}
						</p>
					</div>
				</div>
			</GlassCard>
		</ExternalLink>
	)
}

function SectionHeader({
	action,
	title,
}: {
	title: string
	action?: React.ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-3">
				<div className="h-px w-10 bg-gradient-to-r from-emerald-400/60 to-transparent" />
				<h2 className="text-sm font-semibold tracking-wider text-white/80 uppercase">
					{title}
				</h2>
			</div>
			{action}
		</div>
	)
}

function MetaPill({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
			<div className="text-[10px] tracking-wider text-white/60 uppercase">
				{label}
			</div>
			<div className="font-medium text-white/90">{value}</div>
		</div>
	)
}

function PlaylistChip({ playlist }: { playlist: UiPlaylist }) {
	return (
		<ExternalLink
			href={`https://youtube.com/playlist?list=${playlist.id}`}
			className="min-w-[12rem] rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20"
		>
			<div className="mb-2 h-20 w-full overflow-hidden rounded-lg bg-black/40">
				{playlist.thumbnailUrl ?
					<img
						src={playlist.thumbnailUrl}
						alt={playlist.title}
						className="h-full w-full object-cover"
						loading="lazy"
					/>
				:	<div className="h-full w-full bg-gradient-to-br from-emerald-500 to-lime-400" />
				}
			</div>
			<div className="line-clamp-1 text-sm font-medium">{playlist.title}</div>
			<div className="text-xs text-white/60">{playlist.count} videos</div>
		</ExternalLink>
	)
}

function isoDurationToClock(iso?: string): string {
	if (!iso) return '0:00'
	// rudimentary ISO8601 → H:MM:SS
	const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) || []
	const h = Number(m[1] || 0),
		min = Number(m[2] || 0),
		s = Number(m[3] || 0)
	const mm = h ? String(min).padStart(2, '0') : String(min)
	const ss = String(s).padStart(2, '0')
	return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export async function loader(_: LoaderFunctionArgs): Promise<HomeData> {
	const handle = import.meta.env.VITE_YT_CHANNEL_HANDLE as string

	// Single typed call that does all underlying requests
	const bundle = await getChannelBundleByHandle(handle)
	const ch: YT_Channel = bundle.channel

	// Playlists (limit 8 for UI), fully typed
	const playlists: UiPlaylist[] = (bundle.playlists.items ?? [])
		.slice(0, 8)
		.map(
			(p: YT_Playlist): UiPlaylist => ({
				id: String(p.id ?? ''),
				title: p.snippet?.title ?? 'Untitled',
				thumbnailUrl:
					p.snippet?.thumbnails?.medium?.url ??
					p.snippet?.thumbnails?.default?.url ??
					'',
				count: Number(p.contentDetails?.itemCount ?? 0),
			}),
		)

	// Videos (limit 12 for UI) from already-fetched details, fully typed
	const videos: UiVideo[] = (bundle.details.items ?? []).map(
		(v: YT_Video): UiVideo => ({
			id: String(v.id ?? ''),
			title: v.snippet?.title ?? 'Untitled',
			thumbnailUrl:
				v.snippet?.thumbnails?.medium?.url ??
				v.snippet?.thumbnails?.default?.url ??
				'',
			duration: isoDurationToClock(v.contentDetails?.duration),
			viewCount: Number(v.statistics?.viewCount ?? 0),
			publishedAt: v.snippet?.publishedAt ?? new Date().toISOString(),
		}),
	)

	const isLive = (bundle.live.items ?? []).length > 0

	const channel = {
		handle,
		title: ch.snippet?.title ?? 'Channel',
		subscriberCount: Number(ch.statistics?.subscriberCount ?? 0),
		viewCount: Number(ch.statistics?.viewCount ?? 0),
		videoCount: Number(ch.statistics?.videoCount ?? 0),
		publishedAt: ch.snippet?.publishedAt ?? new Date().toISOString(),
		isLive,
		avatarUrl:
			ch.snippet?.thumbnails?.high?.url ??
			ch.snippet?.thumbnails?.medium?.url ??
			ch.snippet?.thumbnails?.default?.url ??
			'',
		description: ch.snippet?.description ?? '',
		bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl ?? '',
		country: ch.snippet?.country ?? ch.brandingSettings?.channel?.country ?? '',
		hiddenSubscriberCount: Boolean(ch.statistics?.hiddenSubscriberCount),
		keywords: ch.brandingSettings?.channel?.keywords ?? '',
		featuredChannels: ch.brandingSettings?.channel?.featuredChannelsUrls ?? [],
	}

	return { channel, videos, playlists }
}

export default function CreatorHomeMock(): React.JSX.Element {
	const data = useLoaderData() as HomeData
	const { channel, playlists, videos } = data

	return (
		<main className="min-h-dvh text-white">
			<AccentNoiseBackground />
			<div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40vh] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(20,200,120,.4),transparent_70%)]" />
			{channel.bannerUrl ?
				<div className="mx-auto w-full max-w-7xl px-4 md:px-6">
					<div className="mb-4 h-40 overflow-hidden rounded-2xl md:h-56">
						<img
							src={channel.bannerUrl}
							alt="Channel banner"
							className="h-full w-full object-cover"
							loading="eager"
							referrerPolicy="no-referrer"
						/>
					</div>
				</div>
			:	null}
			<header className="mx-auto w-full max-w-7xl px-4 pt-8 pb-6 md:px-6 md:pb-8">
				<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
					<div className="flex items-start gap-4">
						<div className="relative">
							<div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 p-[2px] shadow-sm shadow-emerald-900/30">
								<img
									src={channel.avatarUrl}
									alt={`${channel.title} avatar`}
									className="size-full rounded-[14px] bg-[#0c1116] object-cover"
									loading="eager"
									referrerPolicy="no-referrer"
								/>
							</div>
							{channel.isLive ?
								<span className="absolute -right-1 -bottom-1 inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
									<YouTubeGlyph className="h-3 w-3" />
									Live now
								</span>
							:	null}
						</div>
						<div>
							<h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
								{channel.title}
							</h1>
							<div className="mt-3 flex flex-wrap gap-2">
								<ExternalLink
									href={`https://youtube.com/${channel.handle}?sub_confirmation=1`}
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
								>
									<YouTubeGlyph />
									Subscribe
								</ExternalLink>
								<ExternalLink
									href={`https://youtube.com/${channel.handle}/videos`}
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
								>
									Videos
								</ExternalLink>
								<ExternalLink
									href={`https://youtube.com/${channel.handle}/playlists`}
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
								>
									Playlists
								</ExternalLink>
								<ExternalLink
									href={`https://youtube.com/${channel.handle}/live`}
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
								>
									Live
								</ExternalLink>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2 md:justify-end">
						<MetaPill
							label="Subscribers"
							value={`${fmt(channel.subscriberCount)}`}
						/>
						<MetaPill label="Total views" value={`${fmt(channel.viewCount)}`} />
						<MetaPill label="Videos" value={`${fmt(channel.videoCount)}`} />
						<MetaPill
							label="Joined"
							value={new Date(channel.publishedAt).toLocaleDateString()}
						/>
					</div>
				</div>
			</header>
			<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-20 md:px-6 lg:grid-cols-12">
				<div className="lg:col-span-8 xl:col-span-9">
					<GlassCard className="p-5 md:p-6">
						<SectionHeader
							title="Latest Videos"
							action={
								<ExternalLink
									href={`https://youtube.com/${channel.handle}/videos`}
									className="text-xs text-white/70 hover:text-white"
								>
									View all
								</ExternalLink>
							}
						/>
						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{videos.map((v) => (
								<VideoCard key={v.id} video={v} />
							))}
						</div>
					</GlassCard>
					<GlassCard className="mt-6 p-5 md:p-6">
						<SectionHeader
							title="Playlists"
							action={
								<ExternalLink
									href={`https://youtube.com/${channel.handle}/playlists`}
									className="text-xs text-white/70 hover:text-white"
								>
									View all
								</ExternalLink>
							}
						/>
						<div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-color:theme(colors.emerald.500)_transparent]">
							{playlists.map((p) => (
								<PlaylistChip key={p.id} playlist={p} />
							))}
						</div>
					</GlassCard>
				</div>
				<div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
					<GlassCard>
						<h3 className="text-base font-semibold text-white">About</h3>
						<p className="mt-2 text-sm leading-relaxed text-white/80">
							{channel.description}
						</p>
						<ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Handle</div>
								{channel.handle}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Country</div>
								{channel.country || '—'}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Status</div>
								{channel.isLive ? 'Live now' : 'Offline'}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Last upload</div>
								{videos[0]?.publishedAt &&
									new Date(videos[0].publishedAt).toLocaleDateString()}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Playlists</div>
								{playlists.length}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Featured channels</div>
								{(channel.featuredChannels?.length ?? 0) || '0'}
							</li>
							<li className="col-span-2 rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Keywords</div>
								<div>{channel.keywords || '—'}</div>
							</li>
						</ul>
					</GlassCard>
					<GlassCard>
						<h3 className="text-base font-semibold text-white">Sections</h3>
						<div className="mt-3 flex flex-col gap-2">
							{[
								{ name: 'Home', desc: 'Channel landing' },
								{ name: 'Videos', desc: 'All uploads' },
								{ name: 'Shorts', desc: 'Vertical quick hits' },
								{ name: 'Live', desc: 'Streams & VODs' },
								{ name: 'Playlists', desc: 'Curated series' },
							].map((c) => (
								<Link
									to="/"
									key={c.name}
									className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20"
								>
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 rounded-lg bg-emerald-400/20 ring-1 ring-white/10" />
										<div>
											<div className="text-sm font-medium text-white group-hover:text-white/90">
												{c.name}
											</div>
											<div className="text-xs text-white/70">{c.desc}</div>
										</div>
									</div>
									<YouTubeGlyph className="text-white/70" />
								</Link>
							))}
						</div>
					</GlassCard>
				</div>
			</div>
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-40 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
				<div className="absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
			</div>
			<footer className="mx-auto w-full max-w-7xl px-4 pb-12 text-center text-xs text-white/50 md:px-6">
				<div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
				<p className="mt-3">© {channel.title} 2025</p>
			</footer>
		</main>
	)
}
