"use client";

import { useAppStore } from "@/stores/useAppStore";

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();

	return (
		<div className="max-w-lg">
			<h1 className="text-2xl font-bold mb-6">About</h1>

			<div className="card space-y-4">
				<div className="text-center">
					<div
						className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl text-white font-bold"
						style={{ background: "var(--primary)" }}
					>
						d
					</div>
					<h2 className="text-xl font-bold">deemix</h2>
					<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
						Next.js Edition
					</p>
				</div>

				<div className="space-y-2 text-sm">
					{currentVersion && (
						<div className="flex justify-between">
							<span style={{ color: "var(--text-secondary)" }}>Current Version</span>
							<span>{currentVersion}</span>
						</div>
					)}
					{latestVersion && (
						<div className="flex justify-between">
							<span style={{ color: "var(--text-secondary)" }}>Latest Version</span>
							<span>{latestVersion}</span>
						</div>
					)}
					{updateAvailable && (
						<div
							className="p-3 rounded-lg text-center text-sm"
							style={{ background: "var(--bg-tertiary)" }}
						>
							A new version is available!
						</div>
					)}
				</div>

				<div className="pt-4 border-t text-sm text-center" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
					<p>Migrated to Next.js from the original deemix project.</p>
					<p className="mt-2">
						Original project by{" "}
						<a href="https://github.com/bambanah/deemix" target="_blank" rel="noreferrer">
							Bambanah
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
