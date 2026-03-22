import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/downloads/history — Paginated download history for current user
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const url = new URL(request.url);
		const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
		const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			prisma.downloadHistory.findMany({
				where: { userId: userResult.userId },
				orderBy: { downloadedAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.downloadHistory.count({
				where: { userId: userResult.userId },
			}),
		]);

		return ok({
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (e) {
		return handleError(e);
	}
}
