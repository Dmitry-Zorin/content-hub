import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const videos = pgTable('videos', {
	id: text('id').primaryKey(), // YouTube videoId
	title: text('title').notNull(),
	description: text('description'),
	publishedAt: timestamp('published_at', { mode: 'date' }).notNull(),
	thumbnailUrl: text('thumbnail_url').notNull(),
	externalUrl: text('external_url').notNull(), // https://www.youtube.com/watch?v=...
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})
