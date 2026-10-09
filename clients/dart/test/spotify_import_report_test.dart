import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for SpotifyImportReport
void main() {
  final instance = SpotifyImportReportBuilder();
  // TODO add properties to the builder and call build()

  group(SpotifyImportReport, () {
    // int totalSpotify
    test('to test the property `totalSpotify`', () async {
      // TODO
    });

    // int processed
    test('to test the property `processed`', () async {
      // TODO
    });

    // int matched
    test('to test the property `matched`', () async {
      // TODO
    });

    // BuiltList<SpotifyImportReportNotFoundInner> notFound
    test('to test the property `notFound`', () async {
      // TODO
    });

    // true when the playlist had more than 1000 tracks
    // bool truncated
    test('to test the property `truncated`', () async {
      // TODO
    });

    // true when Spotify only exposed the first 100 tracks of a playlist link (paste track links for the full list)
    // bool limited
    test('to test the property `limited`', () async {
      // TODO
    });

  });
}
