import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for SpotifyTrackBatch
void main() {
  final instance = SpotifyTrackBatchBuilder();
  // TODO add properties to the builder and call build()

  group(SpotifyTrackBatch, () {
    // BuiltList<SpotifyTrack> tracks
    test('to test the property `tracks`', () async {
      // TODO
    });

    // ids Spotify did not return (removed, region-locked)
    // BuiltList<String> failed
    test('to test the property `failed`', () async {
      // TODO
    });

    // ids not read because Spotify started refusing — retry after a pause
    // BuiltList<String> rateLimited
    test('to test the property `rateLimited`', () async {
      // TODO
    });

  });
}
