import { motion } from 'motion/react'
import type { FunctionComponent, SVGProps } from 'react'

export type MotionSvg = ReturnType<typeof createMotionSvg>

export function createMotionSvg(
	svg: FunctionComponent<
		SVGProps<SVGSVGElement> & {
			title?: string
		}
	>,
) {
	return motion.create(svg)
}
