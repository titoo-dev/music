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
    //Future<SkipEnvelope> reportSkip(String trackId) async
    test('test reportSkip', () async {
      // TODO
    });

  });
}
