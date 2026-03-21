import { NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();

		let latestVersion: string | null = null;
		const currentVersion = process.env.npm_package_version || "0.0.0";

		try {
			const got = (await import("got")).default;
			const response = await got
				.get(
					"https://notabug.org/RemixDev/deemix-webui/raw/main/package.json",
					{
						https: { rejectUnauthorized: false },
						timeout: { request: 5000 },
					}
				)
				.json<{ version: string }>();
			latestVersion = response.version || null;
		} catch {
			// Failed to check for updates, not critical
		}

		if (deemixApp) {
			deemixApp.latestVersion = latestVersion;
		}

		const updateAvailable =
			latestVersion !== null && latestVersion !== currentVersion;

		return NextResponse.json({
			currentVersion,
			latestVersion,
			updateAvailable,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
