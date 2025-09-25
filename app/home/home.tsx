import {
	ArrowUpRight,
	ChevronDown,
	Radio,
	Rss,
	Search,
	Tag as TagIcon,
	Twitter,
	Youtube,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'

interface RailButtonProps {
	icon: React.ElementType
	label: string
	active?: boolean
}

const RailButton = ({ icon: Icon, label, active = false }: RailButtonProps) => (
	<button
		className={`group relative grid h-11 w-11 place-items-center rounded-xl border transition ${active ? 'bg-brand-800 border-brand-800 text-white shadow-[0_0_0_2px_rgba(71,184,154,0.25)]' : 'border-brand-800/20 hover:border-brand-600/40 bg-white/60 dark:bg-neutral-900'}`}
		title={label}
	>
		<Icon className="h-5 w-5" />
		{active && (
			<span className="bg-brand-600 absolute top-1/2 -right-2 h-6 w-1.5 -translate-y-1/2 rounded-full" />
		)}
	</button>
)

const Chip = ({ children }: PropsWithChildren) => (
	<span className="border-brand-800/20 inline-flex items-center gap-1 rounded-full border bg-white/70 px-2.5 py-1 text-xs dark:bg-neutral-900">
		<TagIcon className="h-3 w-3" />
		{children}
	</span>
)

const Thumb = ({ label }: { label?: string }) => (
	<div className="border-brand-800/15 relative aspect-video w-full overflow-hidden rounded-xl border bg-[radial-gradient(60%_80%_at_50%_0%,rgba(126,219,194,0.25),transparent),linear-gradient(to_bottom_right,rgba(17,50,41,.25),transparent)]">
		<img
			src="/thumb-placeholder.jpg"
			alt="thumbnail"
			className="absolute inset-0 h-full w-full object-cover opacity-70"
		/>
		<div
			className="absolute inset-0"
			style={{ boxShadow: 'inset 0 0 120px 20px rgba(0,0,0,.35)' }}
		/>
		{label && (
			<div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
				{label}
			</div>
		)}
	</div>
)

const Stat = ({
	title,
	value,
	delta,
}: {
	title: string
	value: string
	delta?: string
}) => (
	<div className="border-brand-800/15 rounded-2xl border bg-white/70 p-4 backdrop-blur dark:bg-neutral-900">
		<div className="text-xs text-gray-500">{title}</div>
		<div className="mt-1 text-2xl leading-none font-semibold">{value}</div>
		{delta && <div className="mt-1 text-xs text-emerald-500">{delta}</div>}
	</div>
)

const PlatformBadge = ({
	type,
}: {
	type: 'video' | 'short' | 'live' | 'reddit' | 'tweet'
}) => {
	const map = {
		video: { icon: Youtube, label: 'YouTube' },
		short: { icon: Youtube, label: 'Shorts' },
		live: { icon: Radio, label: 'Live' },
		reddit: { icon: Rss, label: 'Reddit' },
		tweet: { icon: Twitter, label: 'X/Twitter' },
	}
	const Icon = map[type].icon
	return (
		<span className="border-brand-800/20 inline-flex items-center gap-1 rounded-md border bg-white/60 px-2 py-1 text-[11px] dark:bg-neutral-900">
			<Icon className="h-3.5 w-3.5" /> {map[type].label}
		</span>
	)
}

const ItemCard = ({
	type,
	title,
	meta,
	href,
	tags = [],
	duration,
}: {
	type: 'video' | 'short' | 'live' | 'reddit' | 'tweet'
	title: string
	meta: string
	href: string
	tags?: string[]
	duration?: string
}) => (
	<div className="group border-brand-800/15 bg-paper overflow-hidden rounded-2xl border transition hover:shadow-[0_0_24px_0_var(--brand-300)]">
		<div className="grid md:grid-cols-3">
			<div className="md:col-span-1">
				<Thumb
					label={type === 'video' || type === 'short' ? duration : undefined}
				/>
			</div>
			<div className="flex flex-col gap-3 p-4 md:col-span-2">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-lg leading-snug font-semibold">{title}</h3>
						<div className="mt-1 text-sm text-gray-500">{meta}</div>
					</div>
					<a
						href={href}
						className="text-brand-600 hover:text-brand-400 inline-flex shrink-0 items-center gap-1 text-sm font-medium"
					>
						Open <ArrowUpRight className="h-4 w-4" />
					</a>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<PlatformBadge type={type} />
					{tags.slice(0, 4).map((t, i) => (
						<Chip key={i}>{t}</Chip>
					))}
				</div>
			</div>
		</div>
	</div>
)

interface SectionTitleProps {
	icon: React.ElementType
}

const SectionTitle = ({
	icon: Icon,
	children,
}: PropsWithChildren<SectionTitleProps>) => (
	<div className="flex items-center gap-2">
		<Icon className="text-brand-600 h-4 w-4" />
		<h4 className="font-semibold">{children}</h4>
	</div>
)

export function Home2() {
	return (
		<div className="min-h-screen bg-[radial-gradient(60%_100%_at_50%_0%,rgba(126,219,194,0.18),transparent)] from-gray-50 to-white text-gray-900 dark:from-black dark:to-neutral-950 dark:text-gray-100">
			{/* Header */}
			<header className="bg-paper/70 border-brand-800/20 sticky top-0 z-40 border-b backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
					<div className="flex items-center gap-3">
						<img
							src="/avatar.png"
							alt="Avatar"
							className="h-9 w-9 rounded-xl shadow-[0_0_24px_0_var(--brand-300)]"
						/>
						<div className="leading-tight">
							<div className="font-semibold">Activity Hub</div>
							<div className="text-xs text-gray-500">
								Dream‑themed multi‑platform feed
							</div>
						</div>
					</div>
					<div className="ml-auto flex items-center gap-2">
						<div className="border-brand-800/20 hidden items-center gap-2 rounded-xl border bg-white/50 px-3 py-2 md:flex dark:bg-black/40">
							<Search className="h-4 w-4" />
							<input
								className="w-64 bg-transparent text-sm outline-none"
								placeholder="Search across all activity…"
							/>
						</div>
						<a
							href="https://youtube.com/@creator"
							className="bg-brand-600 hover:bg-brand-400 rounded-xl px-3 py-2 text-sm text-white transition"
						>
							Open YouTube
						</a>
					</div>
				</div>
			</header>

			<main className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-8">
				{/* Main Content */}
				<section className="col-span-12 space-y-6 lg:col-span-8 lg:col-start-3">
					{/* Hero strip with key art */}
					<div className="border-brand-800/20 relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-white/70 p-5 dark:bg-neutral-900">
						<img
							src="/keyart.jpg"
							alt="Key art"
							className="pointer-events-none absolute -top-6 -right-10 h-40 opacity-20 select-none"
						/>
						<div className="border-brand-800/20 h-16 w-16 overflow-hidden rounded-2xl border shadow-[0_0_24px_0_var(--brand-300)]">
							<img
								src="/avatar.png"
								alt="avatar"
								className="h-full w-full object-cover"
							/>
						</div>
						<div className="flex-1">
							<div className="text-xl font-semibold">Creator</div>
							<div className="text-sm text-gray-500">@creator • Last 7d</div>
						</div>
						<div className="grid w-full grid-cols-3 gap-3 md:w-auto md:grid-cols-3">
							<Stat title="Views" value="1.4M" delta="▲ +12%" />
							<Stat title="Watch time" value="18.2k h" delta="▲ +6%" />
							<Stat title="Posts" value="9" />
						</div>
					</div>

					{/* Tabs */}
					<div className="flex items-center gap-2">
						{['Feed', 'Calendar', 'Insights'].map((t, i) => (
							<button
								key={i}
								className={`rounded-full border px-3 py-1.5 text-sm transition ${i === 0 ? 'bg-brand-800 border-brand-800 text-white' : 'border-brand-800/20 hover:border-brand-600/40 bg-white/70 dark:bg-neutral-900'}`}
							>
								{t}
							</button>
						))}
						<div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
							Sort: Recent <ChevronDown className="h-4 w-4" />
						</div>
					</div>

					{/* Stream */}
					<ItemCard
						type="video"
						title="I Rebuilt a Ray Tracer from Scratch"
						meta="YouTube • Sep 12 • 112k views"
						href="/"
						tags={['Upload', '#graphics', '#education']}
						duration="12:48"
					/>
					<ItemCard
						type="live"
						title="Live: Dream Clinic Q&A"
						meta="YouTube Live • Sep 10 • 2h 14m"
						href="/"
						tags={['Q&A', 'Community']}
					/>
					<ItemCard
						type="short"
						title="Fastest way to center a div"
						meta="Shorts • Sep 3 • 1.1M views"
						href="/"
						tags={['#css', 'Snippet']}
						duration="0:35"
					/>
					<ItemCard
						type="reddit"
						title="AMA: Ask me anything about compilers"
						meta="Reddit • r/learnprogramming • 512 comments"
						href="/"
						tags={['Discussion', 'AMA']}
					/>
					<ItemCard
						type="tweet"
						title="Shipping a tiny WASM demo today!"
						meta="X/Twitter • 4,312 likes • 489 reposts"
						href="/"
						tags={['Announcement', 'WASM']}
					/>
				</section>
			</main>

			<footer className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:gap-6">
				<div>© 2025 Creator Activity Hub</div>
				<div className="flex items-center gap-4">
					<a className="hover:underline" href="/">
						Privacy
					</a>
					<a className="hover:underline" href="/">
						Terms
					</a>
				</div>
			</footer>
		</div>
	)
}
