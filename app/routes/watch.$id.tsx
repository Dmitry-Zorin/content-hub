import { useParams } from 'react-router'
import { loadVideos } from '../lib/store.local'

const embedUrl = (id: string) => `https://www.youtube.com/embed/${id}`

export default function WatchPage() {
	const { id = '' } = useParams()
	const video = loadVideos().find((v) => v.id === id)

	if (!video) return <main className="p-6">Not found.</main>

	const ld = {
		'@context': 'https://schema.org',
		'@type': 'VideoObject',
		name: video.title,
		description: video.description ?? '',
		uploadDate: video.publishedAt,
		thumbnailUrl: [video.thumbnailUrl],
		embedUrl: embedUrl(video.id),
		url: video.externalUrl,
	}

	return (
		<main className="mx-auto max-w-4xl p-6">
			<h1 className="mb-3 text-xl font-semibold">{video.title}</h1>
			<div className="mb-4 aspect-video w-full">
				<iframe
					src={embedUrl(video.id)}
					title={video.title}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
					className="h-full w-full rounded border"
				/>
			</div>
			<p className="text-sm text-gray-600">
				Published: {new Date(video.publishedAt).toLocaleString()}
			</p>
			{video.description && (
				<p className="mt-3 text-sm whitespace-pre-wrap">{video.description}</p>
			)}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
			/>
		</main>
	)
}
