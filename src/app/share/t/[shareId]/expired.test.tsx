// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { prismaMock, resetPrismaMock } from "@/test/helpers/mockPrisma";

const { imageResponseMock, notFoundMock } = vi.hoisted(() => ({
	imageResponseMock: vi.fn(),
	notFoundMock: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/og", () => ({
	ImageResponse: class {
		constructor(element: ReactElement, opts: unknown) {
			imageResponseMock(element, opts);
		}
	},
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
// The player is a client component; the page test only needs to know it was chosen.
vi.mock("./SharePlayer", () => ({ SharePlayer: (p: { title: string }) => <p>player:{p.title}</p> }));

import OgImage from "./opengraph-image";
import SharePage from "./page";

const expired = {
	shareId: "abc",
	title: "Nofy",
	artist: "Hosea Marlyn",
	album: null,
	coverUrl: null,
	duration: 295,
	expiresAt: new Date(Date.now() - 3_600_000),
	user: { name: "Tito" },
};

const params = Promise.resolve({ shareId: "abc" });

beforeEach(() => {
	resetPrismaMock();
	imageResponseMock.mockClear();
});

/** All text drawn by a JSX tree, without rendering it. */
function text(node: unknown): string {
	if (node == null || typeof node === "boolean") return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(text).join(" ");
	const el = node as { props?: { children?: unknown } };
	return text(el.props?.children);
}

describe("expired share links", () => {
	it("OG image says the link expired instead of previewing the track (was: full preview kept after expiry)", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(expired as never);
		await OgImage({ params });
		const drawn = text(imageResponseMock.mock.calls[0][0]);
		expect(drawn).toMatch(/expired/i);
		expect(drawn).not.toContain("Nofy");
	});

	it("share page explains the link expired (was: a bare 404)", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue(expired as never);
		const html = renderToStaticMarkup(await SharePage({ params }));
		expect(html).toMatch(/This link has expired/);
		expect(html).not.toContain("player:");
		expect(notFoundMock).not.toHaveBeenCalled();
	});

	it("share page still plays a live link", async () => {
		prismaMock.sharedTrack.findUnique.mockResolvedValue({ ...expired, expiresAt: null } as never);
		const html = renderToStaticMarkup(await SharePage({ params }));
		expect(html).toContain("player:Nofy");
	});
});
