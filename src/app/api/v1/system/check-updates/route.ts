import { ok, handleError } from "../../_lib/helpers";
import { getDeemixApp } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		const currentVersion = process.env.npm_package_version || "0.0.0";

		let latestVersion: string | null = null;

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
			// Failed to check for updates
		}

		if (deemixApp) {
			deemixApp.latestVersion = latestVersion;
		}

		const updateAvailable =
			latestVersion !== null && latestVersion !== currentVersion;

		return ok({ currentVersion, latestVersion, updateAvailable });
	} catch (e) {
		return handleError(e);
	}
}
