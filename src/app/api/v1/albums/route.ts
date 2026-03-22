import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, requireUser } from "../_lib/helpers";

// GET /api/v1/albums — List downloaded albums for current user
export async function GET(request: NextRequest) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const albums = await prisma.album.findMany({
			where: { userId },
			orderBy: { downloadedAt: "desc" },
		});

		return ok(albums);
	} catch (e) {
		return handleError(e);
	}
}
