"use client";

import { useErrorStore } from "@/stores/useErrorStore";

export default function ErrorsPage() {
	const { errors, downloadInfo, clearErrors } = useErrorStore();

	return (
		<div className="max-w-2xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Download Errors</h1>
				{errors.length > 0 && (
					<button onClick={clearErrors} className="btn btn-secondary text-sm">
						Clear All
					</button>
				)}
			</div>

			{downloadInfo && (
				<div className="card mb-4">
					<p className="font-medium">{downloadInfo.title}</p>
					<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
						{downloadInfo.artist} - {downloadInfo.size} tracks
					</p>
				</div>
			)}

			{errors.length === 0 ? (
				<div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
					No errors to display
				</div>
			) : (
				<div className="space-y-2">
					{errors.map((error, idx) => (
						<div key={idx} className="card">
							<div className="flex items-start gap-3">
								<span style={{ color: "var(--danger)" }}>!</span>
								<div className="flex-1">
									<p className="text-sm font-medium">{error.message}</p>
									{error.data && (
										<p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
											{error.data.artist} - {error.data.title} (ID: {error.data.id})
										</p>
									)}
									{error.errid && (
										<span
											className="inline-block text-xs mt-1 px-2 py-0.5 rounded"
											style={{ background: "var(--bg-tertiary)" }}
										>
											{error.errid}
										</span>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
