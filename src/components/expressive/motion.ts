import type { Transition, Variants } from "motion/react";

/**
 * The web side of the Flutter client's `Motion` tokens: one rhythm for the
 * whole app. Durations in seconds (motion/react), curves as cubic-béziers.
 */
export const DUR = { short: 0.15, medium: 0.3, long: 0.45 } as const;

export const EASE = {
	emphasized: [0.2, 0, 0, 1],
	decelerate: [0.05, 0.7, 0.1, 1],
	accelerate: [0.3, 0, 0.8, 0.15],
} as const;

/** Springs for things that move under the pointer (indicators, pills). */
export const SPRING = {
	/** A sliding selection indicator with a little overshoot. */
	indicator: { type: "spring", stiffness: 420, damping: 30, mass: 0.9 } satisfies Transition,
	/** Press feedback release (easeOutBack-ish). */
	press: { type: "spring", stiffness: 600, damping: 22 } satisfies Transition,
	/** Pop (likes, badges). */
	pop: { type: "spring", stiffness: 520, damping: 14 } satisfies Transition,
};

/** `EntranceFade`: fade + rise, staggered by index (60ms steps, capped). */
export function entrance(index = 0, offset = 16) {
	return {
		initial: { opacity: 0, y: offset },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.38, delay: Math.min(index, 10) * 0.06, ease: EASE.decelerate },
	} as const;
}

/** `ScrollReveal`: rise and settle as the element enters the viewport. */
export const reveal = {
	initial: { opacity: 0.2, y: 24, scale: 0.92 },
	whileInView: { opacity: 1, y: 0, scale: 1 },
	viewport: { once: true, margin: "0px 0px -40px 0px" },
	transition: { duration: 0.5, ease: EASE.decelerate },
} as const;

/** `PressScale` for motion elements. */
export const press = (scale = 0.95) => ({ whileTap: { scale }, transition: SPRING.press }) as const;

/** Cross-fade between async states (loading → data …). */
export const swap: Variants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0, transition: { duration: DUR.medium, ease: EASE.decelerate } },
	exit: { opacity: 0, y: -4, transition: { duration: DUR.short, ease: EASE.accelerate } },
};
