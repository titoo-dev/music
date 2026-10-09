import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for SpotifyPlaylist
void main() {
  final instance = SpotifyPlaylistBuilder();
  // TODO add properties to the builder and call build()

  group(SpotifyPlaylist, () {
    // String spotifyId
    test('to test the property `spotifyId`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // String description
    test('to test the property `description`', () async {
      // TODO
    });

    // String ownerName
    test('to test the property `ownerName`', () async {
      // TODO
    });

    // String coverUrl
    test('to test the property `coverUrl`', () async {
      // TODO
    });

    // real size of the playlist (tracks is capped at 1000)
    // int totalTracks
    test('to test the property `totalTracks`', () async {
      // TODO
    });

    // BuiltList<SpotifyTrack> tracks
    test('to test the property `tracks`', () async {
      // TODO
    });

    // String source_
    test('to test the property `source_`', () async {
      // TODO
    });

    // true when Spotify only exposed the first 100 tracks
    // bool limited
    test('to test the property `limited`', () async {
      // TODO
    });

  });
}
