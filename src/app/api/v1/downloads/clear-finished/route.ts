import { ok, handleError, requireApp } from "../../_lib/helpers";

export async function POST() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		app.clearCompletedDownloads();
		return ok({ message: "Finished downloads cleared." });
	} catch (e) {
		return handleError(e);
	}
}
