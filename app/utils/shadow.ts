import { times } from 'remeda'
import { bezier } from '../lib/bezier'

const layerCount = 10
const blurOffsetRatio = 3

const bezier1 = bezier(0.1, 0.5, 0.9, 0.5)
const bezier2 = bezier(0.7, 0.1, 0.9, 0.3)

export function shadow(distance: number, maxAlpha: number) {
	const maxOffset = distance / (blurOffsetRatio + 1)
	const maxBlur = blurOffsetRatio * maxOffset

	return times(layerCount, (i) => {
		const x = (i + 1) / layerCount

		const alpha = bezier1(x) * maxAlpha
		const offset = bezier2(x) * maxOffset
		const blur = bezier2(x) * maxBlur

		return `0 ${offset}px ${blur}px hsl(217deg 15% 50% / ${alpha})`
	}).join(', ')
}
