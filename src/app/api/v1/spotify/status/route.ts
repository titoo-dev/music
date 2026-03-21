import { ok, handleError, requireApp } from "../../_lib/helpers";

export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		const spotify = app.plugins.spotify;
		const enabled = !!spotify?.enabled;
		const credentials = spotify?.getCredentials?.() || {};

		return ok({ enabled, credentials });
	} catch (e) {
		return handleError(e);
	}
}
