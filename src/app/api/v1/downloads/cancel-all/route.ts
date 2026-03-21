import { ok, handleError, requireApp } from "../../_lib/helpers";

export async function POST() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		app.cancelAllDownloads();
		return ok({ message: "All downloads cancelled." });
	} catch (e) {
		return handleError(e);
	}
}
