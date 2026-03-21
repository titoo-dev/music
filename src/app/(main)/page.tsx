"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";
import Link from "next/link";

interface ChartItem {
	id: string;
	title: string;
	picture_medium?: string;
	picture_xl?: string;
	nb_tracks?: number;
}

export default function HomePage() {
	const [charts, setCharts] = useState<ChartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const loggedIn = useLoginStore((s) => s.loggedIn);

	useEffect(() => {
		async function loadHome() {
			try {
				const data = await fetchData("home");
				if (data?.data) setCharts(data.data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadHome();
	}, []);

	const handleDownload = (id: string, type: string) => {
		const url = `https://www.deezer.com/${type}/${id}`;
		postToServer("add-to-queue", { url, bitrate: null });
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg" style={{ color: "var(--text-muted)" }}>
					Loading...
				</div>
			</div>
		);
	}

	if (!loggedIn) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-xl mb-4">Welcome to deemix</p>
				<p style={{ color: "var(--text-secondary)" }}>
					Go to{" "}
					<Link href="/settings" className="font-medium">
						Settings
					</Link>{" "}
					to login with your Deezer ARL token.
				</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Home</h1>

			{charts.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold mb-4">Top Charts</h2>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
						{charts.slice(0, 20).map((item) => (
							<div key={item.id} className="cover-container cursor-pointer">
								<img
									src={item.picture_xl || item.picture_medium || "/placeholder.jpg"}
									alt={item.title}
									loading="lazy"
								/>
								<div className="overlay flex-col gap-2">
									<span className="text-white text-sm font-medium text-center px-2">
										{item.title}
									</span>
									<button
										onClick={() => handleDownload(item.id, "playlist")}
										className="btn btn-primary text-sm"
									>
										Download
									</button>
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
