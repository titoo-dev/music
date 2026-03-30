"use client";

import { Component, ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
}

/**
 * Wraps AudioEngine to prevent audio errors from crashing the entire UI.
 * On error: the audio engine silently stops (no playback), but the rest of the
 * app remains functional. The error is logged for debugging.
 */
export class AudioEngineErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		console.error("[AudioEngine] Unhandled error, audio engine stopped:", error);
	}

	render() {
		// Render nothing on error — UI still works, just no audio engine
		if (this.state.hasError) return null;
		return this.props.children;
	}
}
