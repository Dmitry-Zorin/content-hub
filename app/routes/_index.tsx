import * as React from 'react'

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

// -------------------- Types (match common YT API fields) --------------------

interface ChannelData {
	title: string
	customUrl?: string
	subscriberCount: number // channels.list(part=statistics)
	viewCount: number // channels.list(part=statistics)
	videoCount: number // channels.list(part=statistics)
	publishedAt: string // channels.list(part=snippet)
	isLive?: boolean // infer via search?eventType=live or videos.liveStreamingDetails
}

interface Video {
	id: string
	title: string
	viewCount: number | string
	publishedAt: string // ISO string
	duration: string // ISO8601 or hh:mm:ss after formatting
	thumbSeed: number // placeholder gradient; swap with thumbnails.high.url
}

interface Playlist {
	id: string
	title: string
	count: number
	seed: number
}

// -------------------- Mock from "public" data shape --------------------

const CHANNEL: ChannelData = {
	title: 'The Creator',
	customUrl: '@thecreator',
	subscriberCount: 238000,
	viewCount: 14230000,
	videoCount: 326,
	publishedAt: '2020-06-12T00:00:00Z',
	isLive: false,
}

const VIDEOS: Video[] = Array.from({ length: 12 }).map((_, i) => ({
	id: `vid-${i + 1}`,
	title: [
		'Epic Boss Rush - Highlights',
		'Speedrun Practice: Any%',
		'Cozy Night Stream: Indie Gems',
		'Ranked Grind: Road to Diamond',
		'First Look: New RPG Demo',
		'Challenge Run: No Damage',
		'Controller Cam Q&A',
		'Retro Replay: Pixel Nostalgia',
		'Modded Chaos - Viewer Picks',
		'Collab Stream: Duo Mayhem',
		'Tactics Deep Dive',
		'Stream Setup Tour',
	][i] as string,
	viewCount: [
		48012, 12045, 31022, 27880, 54210, 9722, 19044, 22445, 16022, 44112, 11011,
		8922,
	][i] as number,
	publishedAt: new Date(Date.now() - i * 3.6e6 * 24 * 3).toISOString(),
	duration: [
		'12:47',
		'08:19',
		'03:55:12',
		'01:43:10',
		'18:21',
		'26:05',
		'14:02',
		'2:06:58',
		'49:33',
		'1:12:04',
		'27:40',
		'10:13',
	][i] as string,
	thumbSeed: i * 19 + 7,
}))

const PLAYLISTS: Playlist[] = [
	{ id: 'pl-1', title: 'Highlights', count: 58, seed: 21 },
	{ id: 'pl-2', title: 'Streams (VODs)', count: 112, seed: 55 },
	{ id: 'pl-3', title: 'Indie Discoveries', count: 34, seed: 88 },
	{ id: 'pl-4', title: 'Guides & Tips', count: 16, seed: 133 },
]

// -------------------- UI Bits --------------------

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

function GamepadGlyph(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			aria-hidden
			className={cx('h-4 w-4', props.className)}
		>
			<path
				d="M7 8h10a5 5 0 0 1 4.58 2.96l.86 1.97A4 4 0 0 1 18.72 18h-.44a3 3 0 0 1-2.83-2h-6.9a3 3 0 0 1-2.83 2H5.28A4 4 0 0 1 .56 12.93l.86-1.97A5 5 0 0 1 7 8Zm1.5 2.75h-1v1h-1.5v1.5h1.5v1h1v-1h1.5v-1.5H8.5v-1Zm8.25 1a1.25 1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm-2.5-2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"
				fill="currentColor"
			/>
		</svg>
	)
}

function AccentNoiseBackground() {
	// Build the SVG once and encode it to avoid unterminated-string issues
	const noiseSvg = React.useMemo(
		() =>
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
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

function Thumb({ seed }: { seed: number }) {
	const h = (seed * 47) % 360
	const h2 = (h + 35) % 360
	const bg = `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${h2} 70% 65%))`
	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-xl">
			<div className="absolute inset-0" style={{ background: bg }} />
			<div className="bg-[linear-gradient( to_bottom, rgba(255,255,255,.25), transparent 30%)] absolute inset-0" />
			<div className="absolute inset-0 animate-pulse bg-[radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,.25),transparent_60%)]" />
		</div>
	)
}

function VideoCard({ video }: { video: Video }) {
	const published = new Date(video.publishedAt).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	})
	return (
		<a
			href="#" // link to YouTube watch page in real impl
			className={cx(
				'group relative block focus:outline-none',
				'rounded-2xl ring-0 focus-visible:ring-2 focus-visible:ring-emerald-400/70',
			)}
			aria-label={video.title}
		>
			<GlassCard className="p-3 md:p-4">
				<div className="relative">
					<Thumb seed={video.thumbSeed} />
					<span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
						{video.duration}
					</span>
				</div>
				<div className="mt-3 flex items-start gap-3">
					<div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 shadow-inner" />
					<div>
						<h3 className="line-clamp-2 text-sm font-semibold text-white/95 group-hover:text-white">
							{video.title}
						</h3>
						<p className="mt-1 text-xs text-white/70">
							{fmt(video.viewCount)} views • {published}
						</p>
					</div>
				</div>
			</GlassCard>
		</a>
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

function PlaylistChip({ p }: { p: Playlist }) {
	return (
		<a href="#" className="group min-w-[12rem]">
			<div className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20">
				<div className="mb-2 h-20 w-full overflow-hidden rounded-lg">
					<div
						className="h-full w-full"
						style={{
							background: `linear-gradient(135deg, hsl(${(p.seed * 23) % 360} 70% 50%), hsl(${(p.seed * 23 + 30) % 360} 70% 65%))`,
						}}
					/>
				</div>
				<div className="line-clamp-1 text-sm font-medium text-white/90">
					{p.title}
				</div>
				<div className="text-xs text-white/60">{p.count} videos</div>
			</div>
		</a>
	)
}

// -------------------- Page --------------------

export default function CreatorHomeMock(): React.JSX.Element {
	const channel = CHANNEL

	return (
		<main className="min-h-dvh text-white">
			<AccentNoiseBackground />

			{/* Top gradient ribbon */}
			<div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40vh] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(20,200,120,.4),transparent_70%)]" />

			{/* Header */}
			<header className="mx-auto w-full max-w-7xl px-4 pt-8 pb-6 md:px-6 md:pb-8">
				<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
					<div className="flex items-start gap-4">
						<div className="relative">
							<div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 p-[2px] shadow-sm shadow-emerald-900/30">
								<div className="size-full rounded-[14px] bg-[#0c1116]" />
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
							<p className="mt-1 max-w-prose text-sm text-white/70">
								V‑tuber • gamer • highlights & long‑plays
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<a
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
									href="#"
								>
									<YouTubeGlyph />
									Subscribe
								</a>
								<a
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
									href="#"
								>
									Videos
								</a>
								<a
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
									href="#"
								>
									Playlists
								</a>
								<a
									className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 shadow-sm shadow-black/10 backdrop-blur-md"
									href="#"
								>
									Live
								</a>
							</div>
						</div>
					</div>

					{/* Channel meta (auto from API) */}
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

			{/* Content */}
			<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-20 md:px-6 lg:grid-cols-12">
				{/* Left / Main */}
				<div className="lg:col-span-8 xl:col-span-9">
					<GlassCard className="p-5 md:p-6">
						<SectionHeader
							title="Latest Videos"
							action={
								<a href="#" className="text-xs text-white/70 hover:text-white">
									View all
								</a>
							}
						/>
						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{VIDEOS.map((v) => (
								<VideoCard key={v.id} video={v} />
							))}
						</div>
					</GlassCard>

					<GlassCard className="p-5 md:p-6">
						<SectionHeader
							title="Playlists"
							action={
								<a href="#" className="text-xs text-white/70 hover:text-white">
									View all
								</a>
							}
						/>
						<div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-color:theme(colors.emerald.500)_transparent]">
							{PLAYLISTS.map((p) => (
								<PlaylistChip key={p.id} p={p} />
							))}
						</div>
					</GlassCard>
				</div>

				{/* Right / Sidebar */}
				<div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
					<GlassCard>
						<h3 className="text-base font-semibold text-white">About (Auto)</h3>
						<p className="mt-2 text-sm leading-relaxed text-white/80">
							Channel data shown here comes from the public YouTube API (snippet
							& statistics). No manual schedule required; live badge toggles
							automatically when streaming.
						</p>
						<ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Handle</div>
								{channel.customUrl}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Status</div>
								{channel.isLive ? 'Live now' : 'Offline'}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Last upload</div>
								{/* Replace with search.order=date first item */}
								{VIDEOS[0]?.publishedAt &&
									new Date(VIDEOS[0].publishedAt).toLocaleDateString()}
							</li>
							<li className="rounded-xl bg-white/5 p-3 text-white/80">
								<div className="text-xs text-white/60">Playlists</div>
								{PLAYLISTS.length}
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
								<a
									key={c.name}
									href="#"
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
								</a>
							))}
						</div>
					</GlassCard>
				</div>
			</div>

			{/* Subtle floating accent blobs */}
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-40 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
				<div className="absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
			</div>

			{/* Footer */}
			<footer className="mx-auto w-full max-w-7xl px-4 pb-12 text-center text-xs text-white/50 md:px-6">
				<div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
				<p className="mt-3">© {channel.title} • Auto‑powered by public data</p>
			</footer>
		</main>
	)
}
