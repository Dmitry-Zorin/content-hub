import type { SpringOptions } from 'motion/react'

export const springTransitions = {
	instant: { type: false },
	stiff: springTransition(0.1),
	default: springTransition(0.2),
	gentle: springTransition(0.4),
	slow: springTransition(0.6),
} as const

export function springTransition<Duration extends number>(duration: Duration) {
	return {
		type: 'spring',
		bounce: 0,
		duration,
	} as const satisfies {type: 'spring'}& SpringOptions
}
