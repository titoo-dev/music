/**
 * Sends the last scheduled value once nothing new came for `delay` ms (a drag
 * that settles). `flush` sends a pending value right away — call it when the
 * page goes away, so leaving mid-wait doesn't drop the last change.
 */
export function trailingSend<T>(send: (value: T, opts: { leaving: boolean }) => void, delay: number) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pending: { value: T } | null = null;

	const fire = (leaving: boolean) => {
		if (timer) clearTimeout(timer);
		timer = null;
		if (!pending) return;
		const { value } = pending;
		pending = null;
		send(value, { leaving });
	};

	return {
		schedule(value: T) {
			pending = { value };
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => fire(false), delay);
		},
		flush: () => fire(true),
	};
}
