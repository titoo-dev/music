import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { R2StorageProvider } from "./R2StorageProvider";
import { StorageNotFoundError, StorageUnavailableError } from "./objects";
import { _resetR2Client, listObjectsPage } from "./r2";
import { AwsClient } from "aws4fetch";

const BASE = "https://acct.r2.cloudflarestorage.com/bucket";
const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
const reqAt = (i: number) => new Request(...(fetchMock.mock.calls[i] as [RequestInfo, RequestInit?]));
const calls = () =>
	fetchMock.mock.calls.map((_, i) => reqAt(i)).map((r) => `${r.method} ${decodeURIComponent(r.url.replace(BASE, ""))}`);

describe("R2StorageProvider", () => {
	let provider: R2StorageProvider;

	beforeEach(() => {
		fetchMock.mockReset();
		fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);
		vi.stubEnv("R2_ACCOUNT_ID", "acct");
		vi.stubEnv("R2_BUCKET", "bucket");
		vi.stubEnv("R2_ACCESS_KEY_ID", "AKID");
		vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
		_resetR2Client();
		provider = new R2StorageProvider();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it("ensureDir is a no-op", async () => {
		await provider.ensureDir("music/a");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	describe("exists", () => {
		it("is true when HEAD succeeds", async () => {
			await expect(provider.exists("/music//a.mp3")).resolves.toBe(true);
			expect(calls()).toEqual(["HEAD /music/a.mp3"]);
		});

		it("is false on 404", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 404 }));
			await expect(provider.exists("music/a.mp3")).resolves.toBe(false);
		});

		it("rethrows outages instead of claiming the file is missing", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 403 }));
			await expect(provider.exists("music/a.mp3")).rejects.toBeInstanceOf(StorageUnavailableError);
		});
	});

	describe("readFile", () => {
		it("buffers the object", async () => {
			fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
			expect([...(await provider.readFile("music/a.mp3"))]).toEqual([1, 2, 3]);
		});

		it("throws StorageNotFoundError when the object is missing", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 404 }));
			await expect(provider.readFile("music/a.mp3")).rejects.toBeInstanceOf(StorageNotFoundError);
		});
	});

	it("writeFile PUTs to a deterministic key with the inferred content type", async () => {
		await provider.writeFile("/music/A/cover.jpg", Buffer.from("img"));

		const req = reqAt(0);
		expect(calls()).toEqual(["PUT /music/A/cover.jpg"]);
		expect(req.headers.get("content-type")).toBe("image/jpeg");
		expect(await req.text()).toBe("img");
	});

	it("hands fetch the raw bytes so the upload carries a Content-Length (was: R2 411 MissingContentLength — Next's fetch streamed the signed Request's body chunked)", async () => {
		await provider.writeFile("music/a.mp3", Buffer.from("abc"));

		const [input, init] = fetchMock.mock.calls[0];
		expect(input).not.toBeInstanceOf(Request);
		expect(init?.body).toBeInstanceOf(Uint8Array);
		expect((init?.body as Uint8Array).byteLength).toBe(3);
		expect(new Headers(init?.headers).get("authorization")).toMatch(/^AWS4-HMAC-SHA256 /);
	});

	it("uploads a view of the caller's buffer instead of a copy (was: finalizeStream read the file then copied it again into a new Uint8Array)", async () => {
		const data = Buffer.from("tagged-audio-bytes");

		await provider.writeFile("tracks/1/3.mp3", data);

		const [, init] = fetchMock.mock.calls[0];
		const body = init?.body as Uint8Array;
		expect(body.buffer).toBe(data.buffer);
		expect(body.byteOffset).toBe(data.byteOffset);
		expect(body.byteLength).toBe(data.byteLength);
	});

	it("signs uploads without handing the body to the signer (was: aws4fetch wrapped the whole track in a Request copy just to sign an UNSIGNED-PAYLOAD)", async () => {
		const sign = vi.spyOn(AwsClient.prototype, "sign");

		await provider.writeFile("tracks/1/3.mp3", Buffer.from("abc"));

		expect(sign).toHaveBeenCalledOnce();
		expect((sign.mock.calls[0][1] as RequestInit | undefined)?.body).toBeUndefined();
		const [, init] = fetchMock.mock.calls[0];
		expect(new Headers(init?.headers).get("x-amz-content-sha256")).toBe("UNSIGNED-PAYLOAD");
	});

	describe("stream → tag → finalize pipeline", () => {
		it("buffers to /tmp, exposes the local path, uploads on finalize and cleans up", async () => {
			const stream = provider.createWriteStream("music//A/T.flac");
			const local = provider.getLocalPath("music/A/T.flac");
			await new Promise<void>((resolve) => stream.end("audio-bytes", resolve));

			await provider.finalizeStream("music/A/T.flac");

			const req = reqAt(0);
			expect(calls()).toEqual(["PUT /music/A/T.flac"]);
			expect(req.headers.get("content-type")).toBe("audio/flac");
			expect(await req.text()).toBe("audio-bytes");
			expect(fs.existsSync(local)).toBe(false);
			expect(() => provider.getLocalPath("music/A/T.flac")).toThrow(/createWriteStream/);
		});

		it("still removes the temp file when the upload fails", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 500 }));
			const stream = provider.createWriteStream("music/T.mp3");
			const local = provider.getLocalPath("music/T.mp3");
			await new Promise<void>((resolve) => stream.end("x", resolve));

			await expect(provider.finalizeStream("music/T.mp3")).rejects.toBeInstanceOf(StorageUnavailableError);
			expect(fs.existsSync(local)).toBe(false);
		});

		it("finalizeStream is a no-op without a pending temp file", async () => {
			await provider.finalizeStream("music/none.mp3");
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe("deleteFile", () => {
		it("drops the pending temp file and the object", async () => {
			const stream = provider.createWriteStream("music/T.mp3");
			const local = provider.getLocalPath("music/T.mp3");
			await new Promise<void>((resolve) => stream.end("x", resolve));

			await provider.deleteFile("music/T.mp3");
			expect(fs.existsSync(local)).toBe(false);
			expect(calls()).toEqual(["DELETE /music/T.mp3"]);
		});

		it("swallows delete errors", async () => {
			fetchMock.mockRejectedValue(new Error("network"));
			await expect(provider.deleteFile("music/T.mp3")).resolves.toBeUndefined();
		});
	});

	it("deleteDirectory pages through the prefix and deletes every object", async () => {
		fetchMock.mockImplementation(async (input, init) => {
			const url = new URL(new Request(input, init).url);
			if (url.searchParams.get("list-type") !== "2") return new Response(null, { status: 204 });
			return url.searchParams.get("continuation-token")
				? new Response("<ListBucketResult><Key>music/A/2.mp3</Key><IsTruncated>false</IsTruncated></ListBucketResult>")
				: new Response(
						"<ListBucketResult><Key>music/A/1 &amp; 1.mp3</Key><IsTruncated>true</IsTruncated><NextContinuationToken>t&amp;2</NextContinuationToken></ListBucketResult>"
					);
		});

		await provider.deleteDirectory("/music/A");

		const lists = fetchMock.mock.calls.map((_, i) => new URL(reqAt(i).url)).filter((u) => u.searchParams.get("list-type") === "2");
		expect(lists.map((u) => [u.searchParams.get("prefix"), u.searchParams.get("continuation-token")])).toEqual([
			["music/A/", null],
			["music/A/", "t&2"],
		]);
		expect(calls().filter((c) => c.startsWith("DELETE"))).toEqual(["DELETE /music/A/1 & 1.mp3", "DELETE /music/A/2.mp3"]);
	});

	it("getFileSize reads Content-Length", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 200, headers: { "content-length": "1234" } }));
		await expect(provider.getFileSize("music/a.mp3")).resolves.toBe(1234);
	});

	describe("rename", () => {
		it("remaps a pending temp file without touching the bucket", async () => {
			provider.createWriteStream("music/old.mp3");
			await provider.rename("music/old.mp3", "music/new.mp3");
			expect(provider.getLocalPath("music/new.mp3")).toBeTruthy();
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("copies server-side then deletes the source", async () => {
			await provider.rename("music/old name.mp3", "music/new.mp3");

			expect(calls()).toEqual(["PUT /music/new.mp3", "DELETE /music/old name.mp3"]);
			expect(reqAt(0).headers.get("x-amz-copy-source")).toBe("/bucket/music/old%20name.mp3");
		});
	});

	describe("listObjectsPage", () => {
		it("parses keys, dates and sizes and follows the continuation token", async () => {
			fetchMock.mockImplementation(async (input, init) => {
				const url = new URL(new Request(input, init).url);
				return url.searchParams.get("continuation-token")
					? new Response("<ListBucketResult><Contents><Key>tracks/2/1.mp3</Key><LastModified>2026-10-02T00:00:00.000Z</LastModified><Size>5</Size></Contents><IsTruncated>false</IsTruncated></ListBucketResult>")
					: new Response(
							"<ListBucketResult><Contents><Key>tracks/1/1 &amp; 2.mp3</Key><LastModified>2026-10-01T00:00:00.000Z</LastModified><Size>42</Size></Contents><IsTruncated>true</IsTruncated><NextContinuationToken>n&amp;1</NextContinuationToken></ListBucketResult>"
						);
			});

			const first = await listObjectsPage("tracks/");
			expect(first.objects).toEqual([
				{ key: "tracks/1/1 & 2.mp3", lastModified: new Date("2026-10-01T00:00:00.000Z"), size: 42 },
			]);
			expect(first.nextToken).toBe("n&1");
			const second = await listObjectsPage("tracks/", first.nextToken);
			expect(second.objects.map((o) => o.key)).toEqual(["tracks/2/1.mp3"]);
			expect(second.nextToken).toBeUndefined();
			const url = new URL(reqAt(1).url);
			expect(url.searchParams.get("prefix")).toBe("tracks/");
			expect(url.searchParams.get("continuation-token")).toBe("n&1");
		});

		it("maps an outage to StorageUnavailableError", async () => {
			fetchMock.mockResolvedValue(new Response("", { status: 503 }));
			await expect(listObjectsPage("tracks/")).rejects.toBeInstanceOf(StorageUnavailableError);
		});
	});
});
