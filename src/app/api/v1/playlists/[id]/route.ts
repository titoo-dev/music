import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/playlists/[id] — Get playlist with tracks
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
			include: {
				tracks: { orderBy: { position: "asc" } },
			},
		});

		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		return ok(playlist);
	} catch (e) {
		return handleError(e);
	}
}

// PATCH /api/v1/playlists/[id] — Update playlist
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;
		const { title, description } = await request.json();

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
		});
		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		const updated = await prisma.playlist.update({
			where: { id },
			data: {
				...(title !== undefined && { title: title.trim() }),
				...(description !== undefined && { description: description?.trim() || null }),
			},
		});

		return ok(updated);
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/playlists/[id] — Delete playlist
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	try {
		const { userId, error } = await requireUser(request);
		if (error) return error;

		const { id } = await ctx.params;

		const playlist = await prisma.playlist.findFirst({
			where: { id, userId },
		});
		if (!playlist) {
			return fail("NOT_FOUND", "Playlist not found.", 404);
		}

		if (playlist.title === "Downloads") {
			return fail("PROTECTED", "The Downloads playlist cannot be deleted.", 403);
		}

		await prisma.playlist.delete({ where: { id } });

		return ok({ deleted: true });
	} catch (e) {
		return handleError(e);
	}
}
