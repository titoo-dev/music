import { NextResponse } from "next/server";
import { getDeemixApp } from "@/lib/server-state";

export async function GET() {
	try {
		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const spotify = deemixApp.plugins.spotify;
		const enabled = !!spotify?.enabled;
		const credentials = spotify?.getCredentials?.() || {};

		return NextResponse.json({
			enabled,
			credentials,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
