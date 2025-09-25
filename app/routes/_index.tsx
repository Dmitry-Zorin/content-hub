// src/routes/live._index.tsx  (or add a section to your home page)
import * as React from 'react'
import { listChannelLiveVODs } from '../lib/channelStreams'

const DEFAULT_CHANNEL = import.meta.env.VITE_YT_CHANNEL_OR_HANDLE || '' // e.g., "UCxxxx..." or "@creator"

export default function LiveVODs() {
	const [channel, setChannel] = React.useState(DEFAULT_CHANNEL)
	const [rows, setRows] = React.useState<any[]>([])
	const [busy, setBusy] = React.useState(false)
	const [err, setErr] = React.useState<string | null>(null)

	async function load() {
		if (!channel) return
		setBusy(true)
		setErr(null)
		try {
			const vods = await listChannelLiveVODs(channel, 240)
			setRows(vods)
		} catch (e: any) {
			setErr(e?.message || 'Failed to load VODs')
		} finally {
			setBusy(false)
		}
	}

	React.useEffect(() => {
		load()
	}, [channel])

	return (
		<main className="mx-auto max-w-6xl p-6">
			<h1 className="mb-4 text-2xl font-semibold">Previous live videos</h1>

			<div className="mb-4 flex items-end gap-2">
				<label className="flex flex-col">
					<span className="text-sm text-gray-600">Channel ID or @handle</span>
					<input
						value={channel}
						onChange={(e) => setChannel(e.target.value)}
						placeholder="UCxxxx or @creator"
						className="w-80 rounded border px-2 py-1"
					/>
				</label>
				<button
					onClick={load}
					disabled={busy || !channel}
					className="rounded border px-3 py-1"
				>
					{busy ? 'Loading...' : 'Refresh'}
				</button>
				{err && <span className="text-sm text-red-600">{err}</span>}
			</div>

			<ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
				{rows.map((v) => (
					<li key={v.videoId} className="overflow-hidden rounded-lg border">
						<a href={v.url} target="_blank" rel="noreferrer">
							<img
								src={v.thumbnailUrl}
								alt={v.title}
								className="aspect-video w-full object-cover"
							/>
							<div className="p-3">
								<h2 className="line-clamp-2 text-sm font-medium">{v.title}</h2>
								<p className="text-xs text-gray-500">
									{v.publishedText || v.viewCountText || ''}
								</p>
							</div>
						</a>
					</li>
				))}
			</ul>
		</main>
	)
}
