import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for LyricsApi
void main() {
  final instance = WaveletApi().getLyricsApi();

  group(LyricsApi, () {
    // Lyrics (LRCLIB first, Deezer fallback)
    //
    // Pass title/artist when the track is not in the library nor recent plays. No lyrics → 200 with `source: null`.
    //
    //Future<LyricsEnvelope> getLyrics(String trackId, { String title, String artist, String album, int duration }) async
    test('test getLyrics', () async {
      // TODO
    });

  });
}
