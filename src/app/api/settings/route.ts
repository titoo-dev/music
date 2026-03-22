import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getDeemixApp } from "@/lib/server-state";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		const globalSettings = deemixApp.getSettings();

		// Try per-user settings
		try {
			const session = await auth.api.getSession({ headers: request.headers });
			if (session?.user?.id) {
				const userSettings = await prisma.userSettings.findUnique({
					where: { userId: session.user.id },
				});
				if (userSettings?.settings) {
					return NextResponse.json(
						{
							settings: {
								...globalSettings.settings,
								...(userSettings.settings as Record<string, any>),
							},
							defaultSettings: globalSettings.defaultSettings,
							spotifySettings: globalSettings.spotifySettings,
						},
						{ headers: { "Cache-Control": "no-store" } }
					);
				}
			}
		} catch {
			// No session, return global
		}

		return NextResponse.json(globalSettings, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const { settings, spotifySettings } = await request.json();

		const deemixApp = await getDeemixApp();
		if (!deemixApp) {
			return NextResponse.json({ error: "App not initialized" }, { status: 500 });
		}

		// Save per-user settings if authenticated
		try {
			const session = await auth.api.getSession({ headers: request.headers });
			if (session?.user?.id) {
				await prisma.userSettings.upsert({
					where: { userId: session.user.id },
					update: { settings: settings ?? {} },
					create: { userId: session.user.id, settings: settings ?? {} },
				});
			}
		} catch {
			// No session, save globally
			await deemixApp.saveSettings(settings, spotifySettings);
		}

		// Always save Spotify settings globally
		if (spotifySettings) {
			await deemixApp.saveSettings(deemixApp.settings, spotifySettings);
		}

		return NextResponse.json(deemixApp.getSettings(), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
