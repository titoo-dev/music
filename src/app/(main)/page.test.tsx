// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const getServerSession = vi.fn();
vi.mock("@/lib/server-fetch", () => ({ getServerSession: () => getServerSession(), serverFetch: vi.fn() }));
vi.mock("./_components/HomeContent", () => ({ HomeContent: () => null }));

import HomePage from "./page";
import { serverFetch } from "@/lib/server-fetch";

const savedAt = new Date("2026-10-01T10:00:00Z");

beforeEach(() => {
	resetPrismaMock();
	getServerSession.mockResolvedValue({ user: { id: "u1", name: "Ada" } });
	vi.stubGlobal("fetch", vi.fn());
	prismaMock.playlist.findMany.mockResolvedValue([
		{ id: "p1", title: "Mix", updatedAt: savedAt, _count: { tracks: 2 }, tracks: [{ coverUrl: "a.jpg" }, { coverUrl: null }] },
	]);
	prismaMock.album.findMany.mockResolvedValue([{ id: "al1", deezerAlbumId: "302127", title: "Discovery", savedAt }]);
	prismaMock.recentPlay.findMany.mockResolvedValue([{ id: "r1", trackId: "1", playedAt: savedAt }]);
	prismaMock.savedTrack.findMany.mockResolvedValue([{ id: "s1", trackId: "1", savedAt }]);
});

type Props = { playlists: Array<{ covers: string[]; tracks?: unknown }>; albums: Array<{ savedAt: unknown }>; recentPlays: unknown[]; tracks: unknown[]; user: unknown };

describe("Home page data (NAV-30)", () => {
	it("reads the library straight from the database, no HTTP round trips to its own API (was: 4 loopback requests per visit)", async () => {
		const el = (await HomePage()) as unknown as { props: Props };
		expect(fetch).not.toHaveBeenCalled();
		expect(serverFetch).not.toHaveBeenCalled();
		expect(getServerSession).toHaveBeenCalledOnce();
		expect(prismaMock.recentPlay.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" }, take: 24 }));
		expect(el.props.user).toEqual({ name: "Ada" });
	});

	it("hands the client the same shapes the API returned", async () => {
		const { props } = (await HomePage()) as unknown as { props: Props };
		expect(props.playlists[0].covers).toEqual(["a.jpg"]);
		expect(props.playlists[0].tracks).toBeUndefined();
		expect(props.albums[0].savedAt).toBe(savedAt.toISOString());
		expect(props.recentPlays).toHaveLength(1);
		expect(props.tracks).toHaveLength(1);
	});

	it("still renders when one source fails", async () => {
		prismaMock.album.findMany.mockRejectedValue(new Error("db down"));
		const { props } = (await HomePage()) as unknown as { props: Props };
		expect(props.albums).toEqual([]);
		expect(props.playlists).toHaveLength(1);
	});

	it("signed out: empty home, no queries", async () => {
		getServerSession.mockResolvedValue(null);
		const { props } = (await HomePage()) as unknown as { props: Props };
		expect(props.user).toBeNull();
		expect(prismaMock.playlist.findMany).not.toHaveBeenCalled();
	});
});
