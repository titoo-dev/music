import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for SharesApi
void main() {
  final instance = WaveletApi().getSharesApi();

  group(SharesApi, () {
    // Create (or reuse) a public share link for a track
    //
    // Returns 200 with your live (unexpired) share if one already exists for this track, 201 otherwise; your expired links for the track are deleted. The public metadata (title, artist, album, cover, duration) comes from Deezer when your Deezer session knows the track; otherwise the sent values are used (`title` and `artist` then required, non-blank). Public page: `https://wavelet.titosy.dev/share/t/{shareId}`.
    //
    //Future<SharedTrackEnvelope> createShare(CreateShareInput createShareInput) async
    test('test createShare', () async {
      // TODO
    });

    // Revoke a share link (owner only)
    //
    //Future<DeletedEnvelope> deleteShare(String shareId) async
    test('test deleteShare', () async {
      // TODO
    });

    // Public share metadata (no auth)
    //
    //Future<PublicShareEnvelope> getShare(String shareId) async
    test('test getShare', () async {
      // TODO
    });

    // My share links
    //
    //Future<SharedTrackListEnvelope> listShares() async
    test('test listShares', () async {
      // TODO
    });

    // Public audio stream of a shared track (no auth)
    //
    // - **Cached copy** (the best R2 copy of the track, found by trackId — a copy persisted after the share was created is used and re-linked): proxied from R2, Range passed through (206 + `Content-Range`), `Accept-Ranges: bytes`, `Cache-Control: private, no-cache` (a revoked or expired link stops playing at once). - **Fallback** (no cached copy, or the R2 read failed): streamed live through the share owner's Deezer account with the same Range rules as `/stream-progressive` — no Range, `bytes=0-` or `bytes=0-b` → persisting play (200, or 206 `Content-Range: bytes 0-b/n` when the Deezer CDN honours ranges; `Accept-Ranges: none` when it does not); a single range starting above 0 → 206 live-only; past the end → 416 `Content-Range: bytes *_/n`. Limited to 30 fallback requests per client address per 10 min (per server instance): over it → 429 `RATE_LIMITED` + `Retry-After`. Errors before the first byte: 422 `TRACK_UNAVAILABLE` / 502 `UPSTREAM_ERROR`. - **Play counter**: +1 per successful (status < 400) request with no Range, `bytes=0-` or `bytes=0-n` with n > 1 (Safari / AVPlayer after their `bytes=0-1` probe) — not per seek, nor for a refused or failed request.
    //
    //Future<Uint8List> streamShare(String shareId, { String range }) async
    test('test streamShare', () async {
      // TODO
    });

  });
}
