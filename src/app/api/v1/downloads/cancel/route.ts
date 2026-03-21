import { NextRequest } from "next/server";
import { ok, fail, handleError, requireApp } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		const { uuid } = await request.json();
		if (!uuid) {
			return fail("MISSING_UUID", "Download UUID is required.", 400);
		}

		app.cancelDownload(uuid);
		return ok({ message: "Download cancelled." });
	} catch (e) {
		return handleError(e);
	}
}
