const kSplineTableSize = 11
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0)

function A(aA1: number, aA2: number) {
	return 1.0 - 3.0 * aA2 + 3.0 * aA1
}

function B(aA1: number, aA2: number) {
	return 3.0 * aA2 - 6.0 * aA1
}

function C(aA1: number) {
	return 3.0 * aA1
}

function calcBezier(aT: number, aA1: number, aA2: number) {
	return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
}

function getSlope(aT: number, aA1: number, aA2: number) {
	return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1)
}

function binarySubdivide(
	aX: number,
	aA: number,
	aB: number,
	mX1: number,
	mX2: number,
) {
	let currentX
	let currentT
	let i = 0

	do {
		currentT = aA + (aB - aA) / 2.0
		currentX = calcBezier(currentT, mX1, mX2) - aX
		if (currentX > 0.0) {
			aB = currentT
		} else {
			aA = currentT
		}
	} while (Math.abs(currentX) > 0.0000001 && ++i < 10)

	return currentT
}

function newtonRaphsonIterate(
	aX: number,
	aGuessT: number,
	mX1: number,
	mX2: number,
) {
	for (let i = 0; i < 4; ++i) {
		const currentSlope = getSlope(aGuessT, mX1, mX2)
		if (currentSlope === 0.0) {
			return aGuessT
		}
		const currentX = calcBezier(aGuessT, mX1, mX2) - aX
		aGuessT -= currentX / currentSlope
	}
	return aGuessT
}

export function bezier(mX1: number, mY1: number, mX2: number, mY2: number) {
	const sampleValues = new Float32Array(kSplineTableSize)

	for (let i = 0; i < kSplineTableSize; ++i) {
		sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2)
	}

	function getTForX(aX: number) {
		let intervalStart = 0.0
		let currentSample = 1
		const lastSample = kSplineTableSize - 1

		for (
			;
			currentSample !== lastSample && (sampleValues[currentSample] ?? 0) <= aX;
			++currentSample
		) {
			intervalStart += kSampleStepSize
		}
		--currentSample

		const dist =
			(aX - (sampleValues[currentSample] ?? 0)) /
			((sampleValues[currentSample + 1] ?? 0) -
				(sampleValues[currentSample] ?? 0))
		const guessForT = intervalStart + dist * kSampleStepSize

		const initialSlope = getSlope(guessForT, mX1, mX2)

		if (initialSlope >= 0.001) {
			return newtonRaphsonIterate(aX, guessForT, mX1, mX2)
		} else if (initialSlope === 0.0) {
			return guessForT
		} else {
			return binarySubdivide(
				aX,
				intervalStart,
				intervalStart + kSampleStepSize,
				mX1,
				mX2,
			)
		}
	}

	return (x: number) => calcBezier(getTForX(x), mY1, mY2)
}
