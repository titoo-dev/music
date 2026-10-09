// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/helpers/mockPrisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import OgImage from "./opengraph-image";

describe("share OG image", () => {
	it("renders a PNG with the bundled font (was: font fetch answered 404, so the image failed)", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		prismaMock.sharedTrack.findUnique.mockResolvedValue({
			title: "Nofy",
			artist: "Hosea Marlyn",
			album: "Fitiavana",
			coverUrl: null,
			user: { name: "Tito" },
		} as never);

		const res = await OgImage({ params: Promise.resolve({ shareId: "abc" }) });
		const png = new Uint8Array(await res.arrayBuffer());

		expect(res.headers.get("content-type")).toBe("image/png");
		expect([...png.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
		expect(png.length).toBeGreaterThan(5000);
		// Nothing reaches out to fonts.gstatic.com any more.
		expect(fetchSpy.mock.calls.some(([u]) => String(u).includes("fonts.gstatic.com"))).toBe(false);
	}, 60_000);
});
