"use client";

import { useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { convertDuration } from "@/utils/helpers";

export default function LinkAnalyzerPage() {
	const [link, setLink] = useState("");
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleAnalyze = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!link.trim()) return;
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const data = await fetchData("analyze-link", { term: link.trim() });
			if (data.error) {
				setError(data.error);
			} else {
				setResult(data);
			}
		} catch {
			setError("Failed to analyze link");
		}
		setLoading(false);
	};

	const handleDownload = () => {
		if (link.trim()) {
			postToServer("add-to-queue", { url: link.trim(), bitrate: null });
		}
	};

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">Link Analyzer</h1>

			<form onSubmit={handleAnalyze} className="flex gap-2 mb-6">
				<input
					type="text"
					value={link}
					onChange={(e) => setLink(e.target.value)}
					placeholder="Paste a Deezer or Spotify link..."
					className="input flex-1"
				/>
				<button type="submit" className="btn btn-primary" disabled={loading}>
					{loading ? "..." : "Analyze"}
				</button>
			</form>

			{error && (
				<div className="p-4 rounded-lg mb-4" style={{ background: "var(--bg-tertiary)" }}>
					<span style={{ color: "var(--danger)" }}>{error}</span>
				</div>
			)}

			{result && (
				<div className="card">
					<div className="flex gap-4 mb-4">
						{(result.cover_xl || result.cover_big || result.picture_xl) && (
							<img
								src={result.cover_xl || result.cover_big || result.picture_xl}
								alt=""
								className="w-32 h-32 rounded-lg object-cover"
							/>
						)}
						<div>
							<h2 className="text-xl font-bold">{result.title}</h2>
							{result.artist?.name && (
								<p style={{ color: "var(--text-secondary)" }}>{result.artist.name}</p>
							)}
							{result.duration && (
								<p className="text-sm" style={{ color: "var(--text-muted)" }}>
									Duration: {convertDuration(result.duration)}
								</p>
							)}
							{result.nb_tracks && (
								<p className="text-sm" style={{ color: "var(--text-muted)" }}>
									{result.nb_tracks} tracks
								</p>
							)}
							<button onClick={handleDownload} className="btn btn-primary mt-3">
								Download
							</button>
						</div>
					</div>

					{result.tracks?.data && (
						<div className="mt-4 space-y-1">
							{result.tracks.data.map((track: any, idx: number) => (
								<div key={track.id || idx} className="flex items-center gap-3 py-1">
									<span className="text-xs w-6 text-right" style={{ color: "var(--text-muted)" }}>
										{idx + 1}
									</span>
									<span className="text-sm flex-1 truncate">{track.title}</span>
									<span className="text-xs" style={{ color: "var(--text-muted)" }}>
										{convertDuration(track.duration)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
