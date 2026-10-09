import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for ImportSpotifyPlaylistRequestOneOf1
void main() {
  final instance = ImportSpotifyPlaylistRequestOneOf1Builder();
  // TODO add properties to the builder and call build()

  group(ImportSpotifyPlaylistRequestOneOf1, () {
    // tracks read with POST /playlists/import/spotify/tracks
    // BuiltList<SpotifyTrack> tracks
    test('to test the property `tracks`', () async {
      // TODO
    });

    // track ids that could not be read (reported as not found)
    // BuiltList<String> unreadable
    test('to test the property `unreadable`', () async {
      // TODO
    });

    // number of pasted links, for the truncated flag
    // int total
    test('to test the property `total`', () async {
      // TODO
    });

    // name of the new playlist (default \"Spotify import\")
    // String title
    test('to test the property `title`', () async {
      // TODO
    });

  });
}
