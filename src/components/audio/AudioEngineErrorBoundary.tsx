"use client";

import { Component, ReactNode } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

interface InnerProps {
	children: ReactNode;
	resetKey: string | null;
}

interface State {
	hasError: boolean;
}

class AudioEngineErrorBoundaryInner extends Component<InnerProps, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidUpdate(prevProps: InnerProps) {
		// Auto-reset when user plays a new track — allows recovery without page refresh
		if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
			this.setState({ hasError: false });
		}
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

/**
 * Wraps AudioEngine to prevent audio errors from crashing the entire UI.
 * Automatically resets when the user plays a new track.
 */
export function AudioEngineErrorBoundary({ children }: { children: ReactNode }) {
	const trackId = usePlayerStore((s) => s.currentTrack?.trackId ?? null);
	return (
		<AudioEngineErrorBoundaryInner resetKey={trackId}>
			{children}
		</AudioEngineErrorBoundaryInner>
	);
}
