import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for StreamingApi
void main() {
  final instance = WaveletApi().getStreamingApi();

  group(StreamingApi, () {
    // Step 1 — presigned direct URL if the track is cached
    //
    // Recommended playback flow: 1. `GET /stream-url/{id}` → if `url` is set, play it directly (CDN, Range-capable, ~15 min validity). 2. Otherwise play `GET /stream-progressive/{id}` (live from Deezer, persisted to Blob in the background). `/stream/{id}` is the same-origin proxy for cached files.
    //
    //Future<StreamUrlEnvelope> getStreamUrl(String trackId) async
    test('test getStreamUrl', () async {
      // TODO
    });

    // Stream a cached track (Range supported)
    //
    // Cache miss / storage down → 302 to `/api/v1/stream-progressive/{trackId}`. The audio player must follow redirects and keep sending the session cookie.
    //
    //Future<Uint8List> streamCached(String trackId, { String range }) async
    test('test streamCached', () async {
      // TODO
    });

    // Live stream from Deezer (decrypted on the fly, persisted in background)
    //
    // No Range support (`Accept-Ranges: none`) — seeking beyond the buffer requires restarting the stream. Already cached → 302 to `/api/v1/stream/{trackId}`.
    //
    //Future<Uint8List> streamProgressive(String trackId, { String preview, String head }) async
    test('test streamProgressive', () async {
      // TODO
    });

    // Public audio stream of a shared track (no auth)
    //
    // Range supported when served from cache (206); live fallback has `Accept-Ranges: none`. Each call increments the play counter.
    //
    //Future<Uint8List> streamShare(String shareId, { String range }) async
    test('test streamShare', () async {
      // TODO
    });

    // Prefetch Deezer metadata so the next play starts faster
    //
    // Fire-and-forget, always 204 on success. Call when a track is about to be played (e.g. next in queue).
    //
    //Future warmStream(String trackId) async
    test('test warmStream', () async {
      // TODO
    });

  });
}
