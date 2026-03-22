import { NextRequest } from "next/server";
import { clean_search_query } from "@/lib/deezer/utils";
import { ok, fail, handleError, getGuestOrUserDz } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const rawTerm = searchParams.get("term") || "";

		const term = clean_search_query(rawTerm);
		if (!term) {
			return fail("MISSING_TERM", "A search term is required.", 400);
		}

		const { dz } = await getGuestOrUserDz(request);
		if (!dz) return fail("NO_DEEZER", "Deezer is not available. Sign in or configure a service ARL.", 503);

		// Query GW (rich metadata) and public API (better ranking) in parallel
		const [gwResults, apiTracks, apiAlbums, apiArtists] =
			await Promise.allSettled([
				dz.gw.search(term, 0, 100),
				dz.api.search_track(term, { limit: 50 }),
				dz.api.search_album(term, { limit: 50 }),
				dz.api.search_artist(term, { limit: 50 }),
			]);

		const gw =
			gwResults.status === "fulfilled" ? gwResults.value : ({} as any);

		// Merge public API results into GW results to fill gaps and improve coverage
		const merged = { ...gw };

		// Merge tracks: deduplicate by SNG_ID/id
		if (apiTracks.status === "fulfilled") {
			const apiData = (apiTracks.value as any)?.data || [];
			const existingIds = new Set(
				(merged.TRACK?.data || []).map((t: any) => String(t.SNG_ID))
			);
			const newTracks = apiData.filter(
				(t: any) => !existingIds.has(String(t.id))
			);
			if (newTracks.length > 0) {
				merged.TRACK = merged.TRACK || { data: [], count: 0 };
				merged.TRACK.data = [...(merged.TRACK.data || []), ...newTracks];
				merged.TRACK.count =
					(merged.TRACK.count || 0) + newTracks.length;
			}
		}

		// Merge albums: deduplicate by ALB_ID/id
		if (apiAlbums.status === "fulfilled") {
			const apiData = (apiAlbums.value as any)?.data || [];
			const existingIds = new Set(
				(merged.ALBUM?.data || []).map((a: any) => String(a.ALB_ID))
			);
			const newAlbums = apiData.filter(
				(a: any) => !existingIds.has(String(a.id))
			);
			if (newAlbums.length > 0) {
				merged.ALBUM = merged.ALBUM || { data: [], count: 0 };
				merged.ALBUM.data = [...(merged.ALBUM.data || []), ...newAlbums];
				merged.ALBUM.count =
					(merged.ALBUM.count || 0) + newAlbums.length;
			}
		}

		// Merge artists: deduplicate by ART_ID/id
		if (apiArtists.status === "fulfilled") {
			const apiData = (apiArtists.value as any)?.data || [];
			const existingIds = new Set(
				(merged.ARTIST?.data || []).map((a: any) => String(a.ART_ID))
			);
			const newArtists = apiData.filter(
				(a: any) => !existingIds.has(String(a.id))
			);
			if (newArtists.length > 0) {
				merged.ARTIST = merged.ARTIST || { data: [], count: 0 };
				merged.ARTIST.data = [
					...(merged.ARTIST.data || []),
					...newArtists,
				];
				merged.ARTIST.count =
					(merged.ARTIST.count || 0) + newArtists.length;
			}
		}

		return ok(merged);
	} catch (e) {
		return handleError(e);
	}
}
