"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/cover-image";
import { Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DownloadItem {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string | null;
	albumId: string | null;
	coverUrl: string | null;
	bitrate: number;
	storageType: string;
	downloadedAt: string;
}

const bitrateLabels: Record<number, string> = {
	1: "MP3 128",
	3: "MP3 320",
	9: "FLAC",
	15: "360 HQ",
	14: "360 MQ",
	13: "360 LQ",
};

export default function DownloadHistoryPage() {
	const [items, setItems] = useState<DownloadItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	useEffect(() => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		async function load() {
			setLoading(true);
			try {
				const data = await fetchData("downloads/history", {
					page: String(page),
					limit: "50",
				});
				setItems(data.items || []);
				setTotalPages(data.totalPages || 1);
				setTotal(data.total || 0);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		load();
	}, [page, isAuthenticated]);

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground">Sign in to view your download history.</p>
				<Link href="/login">
					<Button>Sign in</Button>
				</Link>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Download History</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{total} track{total !== 1 ? "s" : ""} downloaded
				</p>
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<Download className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No downloads yet</p>
					<p className="text-xs text-muted-foreground">
						Downloaded tracks will appear here.
					</p>
				</div>
			) : (
				<>
					<div className="space-y-1">
						{items.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
							>
								<div className="shrink-0 size-10 rounded overflow-hidden bg-muted">
									{item.coverUrl ? (
										<CoverImage
											src={item.coverUrl}
											alt={item.title}
											className="size-10"
										/>
									) : (
										<div className="size-10 flex items-center justify-center text-xs text-muted-foreground">
											?
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{item.title}</p>
									<p className="text-xs text-muted-foreground truncate">
										{item.artist}
										{item.album ? ` \u00B7 ${item.album}` : ""}
									</p>
								</div>
								<div className="shrink-0 text-right">
									<p className="text-xs text-muted-foreground">
										{bitrateLabels[item.bitrate] || `${item.bitrate}`}
									</p>
									<p className="text-xs text-muted-foreground">
										{new Date(item.downloadedAt).toLocaleDateString()}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-4">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
