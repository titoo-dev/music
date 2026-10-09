import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for LyricsApi
void main() {
  final instance = WaveletApi().getLyricsApi();

  group(LyricsApi, () {
    // Lyrics (LRCLIB exact → Deezer → LRCLIB fuzzy search)
    //
    // Send title/artist/album/duration of the playing track for the best match; otherwise they come from the library, recent plays or the Deezer track API. Synced lyrics are only returned when the matched recording's length is within 3 s. No lyrics → 200 with `source: null`. 400 MISSING_METADATA only when there is no metadata and no Deezer session.
    //
    //Future<LyricsEnvelope> getLyrics(String trackId, { String title, String artist, String album, int duration }) async
    test('test getLyrics', () async {
      // TODO
    });

  });
}
