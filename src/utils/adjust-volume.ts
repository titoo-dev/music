// Track one active fade timer per audio element to prevent concurrent fades fighting over volume
const activeTimers = new WeakMap<HTMLAudioElement, ReturnType<typeof setInterval>>();

export function adjustVolume(
	audio: HTMLAudioElement,
	targetVolume: number,
	options: { duration?: number } = {}
): Promise<void> {
	// Cancel any in-progress fade on this element before starting a new one
	const existing = activeTimers.get(audio);
	if (existing !== undefined) clearInterval(existing);

	const { duration = 1000 } = options;
	const interval = 13;
	const steps = Math.ceil(duration / interval);
	const startVolume = audio.volume;
	const delta = targetVolume - startVolume;
	let step = 0;

	return new Promise((resolve) => {
		if (steps === 0 || delta === 0) {
			audio.volume = targetVolume;
			activeTimers.delete(audio);
			resolve();
			return;
		}

		const timer = setInterval(() => {
			step++;
			const progress = step / steps;
			// Ease in-out (cosine)
			const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
			audio.volume = Math.min(1, Math.max(0, startVolume + delta * eased));

			if (step >= steps) {
				clearInterval(timer);
				activeTimers.delete(audio);
				audio.volume = Math.min(1, Math.max(0, targetVolume));
				resolve();
			}
		}, interval);
		activeTimers.set(audio, timer);
	});
}
