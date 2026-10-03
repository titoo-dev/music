import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for StreamUrl
void main() {
  final instance = StreamUrlBuilder();
  // TODO add properties to the builder and call build()

  group(StreamUrl, () {
    // Presigned Vercel Blob URL, valid ~15 min. null → use /stream-progressive.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // String contentType
    test('to test the property `contentType`', () async {
      // TODO
    });

    // Present only when `url` is null
    // String status
    test('to test the property `status`', () async {
      // TODO
    });

  });
}
