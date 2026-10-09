import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for RecentPlaysApi
void main() {
  final instance = WaveletApi().getRecentPlaysApi();

  group(RecentPlaysApi, () {
    // Listening history (most recent first, cap 100)
    //
    //Future<RecentPlayListEnvelope> listRecentPlays({ int limit }) async
    test('test listRecentPlays', () async {
      // TODO
    });

    // Log a play — call after 30 s of continuous playback
    //
    //Future<LoggedEnvelope> logRecentPlay(RecentPlayInput recentPlayInput) async
    test('test logRecentPlay', () async {
      // TODO
    });

    // Report a skip before 30 s (lets the server free the cached file)
    //
    // The file is kept (`{ kept: true, reason }`) when this user already logged a real play (`already_played`), anything else references the track (`anchored`), a persist of it is in flight (`persisting`) or its cached copy is younger than 10 min (`recent`). Otherwise it is freed (`{ evicted: true }`); the metadata in saved-* tables stays, so a replay re-streams.
    //
    //Future<SkipEnvelope> reportSkip(String trackId) async
    test('test reportSkip', () async {
      // TODO
    });

  });
}
