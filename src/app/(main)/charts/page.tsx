"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { convertDuration } from "@/utils/helpers";

export default function ChartsPage() {
	const [countries, setCountries] = useState<any[]>([]);
	const [selectedChart, setSelectedChart] = useState<any>(null);
	const [tracks, setTracks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingTracks, setLoadingTracks] = useState(false);

	useEffect(() => {
		async function loadCharts() {
			try {
				const data = await fetchData("charts");
				setCountries(data || []);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadCharts();
	}, []);

	const loadChartTracks = async (chart: any) => {
		setSelectedChart(chart);
		setLoadingTracks(true);
		try {
			const data = await fetchData("chart-tracks", { id: chart.id.toString() });
			setTracks(data?.data || []);
		} catch {
			setTracks([]);
		}
		setLoadingTracks(false);
	};

	const handleDownload = (id: string, type: string = "track") => {
		const url = `https://www.deezer.com/${type}/${id}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	const handleDownloadAll = () => {
		if (selectedChart) {
			const url = `https://www.deezer.com/playlist/${selectedChart.id}`;
			postToServer("add-to-queue", { url, bitrate: null });
		}
	};

	if (loading) {
		return <div style={{ color: "var(--text-muted)" }}>Loading charts...</div>;
	}

	if (selectedChart) {
		return (
			<div>
				<div className="flex items-center gap-4 mb-6">
					<button onClick={() => setSelectedChart(null)} className="btn btn-secondary text-sm">
						Back
					</button>
					<h1 className="text-xl font-bold">{selectedChart.title}</h1>
					<button onClick={handleDownloadAll} className="btn btn-primary text-sm">
						Download All
					</button>
				</div>

				{loadingTracks ? (
					<div style={{ color: "var(--text-muted)" }}>Loading tracks...</div>
				) : (
					<div className="space-y-1">
						{tracks.map((track: any, idx: number) => (
							<div
								key={track.id || idx}
								className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group"
								onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
								onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
							>
								<span className="text-sm w-8 text-right" style={{ color: "var(--text-muted)" }}>
									{idx + 1}
								</span>
								{track.album?.cover_small && (
									<img src={track.album.cover_small} alt="" className="w-10 h-10 rounded" />
								)}
								<div className="flex-1 min-w-0">
									<div className="text-sm truncate">{track.title}</div>
									<div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
										{track.artist?.name}
									</div>
								</div>
								<span className="text-xs" style={{ color: "var(--text-muted)" }}>
									{convertDuration(track.duration)}
								</span>
								<button
									onClick={() => handleDownload(track.id, "track")}
									className="opacity-0 group-hover:opacity-100 btn btn-primary text-xs py-1 px-2"
								>
									DL
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Charts</h1>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{countries.map((country: any) => (
					<div
						key={country.id}
						className="cover-container cursor-pointer"
						onClick={() => loadChartTracks(country)}
					>
						<img
							src={country.picture_medium || country.picture_big || "/placeholder.jpg"}
							alt={country.title}
							loading="lazy"
						/>
						<div className="overlay">
							<span className="text-white text-sm font-medium text-center px-2">{country.title}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
