import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for StreamUrl
void main() {
  final instance = StreamUrlBuilder();
  // TODO add properties to the builder and call build()

  group(StreamUrl, () {
    // Presigned Cloudflare R2 URL, valid 1 h (3600 s, see `expiresAt`). null → see `status`.
    // String url
    test('to test the property `url`', () async {
      // TODO
    });

    // Present only when `url` is set
    // String contentType
    test('to test the property `contentType`', () async {
      // TODO
    });

    // Present only when `url` is set. ISO-8601 instant the presigned URL lapses (signing time + 3600 s, never later than the real expiry). Refresh it with this endpoint before then.
    // DateTime expiresAt
    test('to test the property `expiresAt`', () async {
      // TODO
    });

    // Present only when `url` is null. `not_cached`: no usable cached copy (including a copy below this listener's quality, which the progressive play upgrades) → play /stream-progressive. `unsupported_storage`: only copies in older storage → /stream-progressive. `file_missing`: the object is gone from R2 → /stream-progressive. `presigned_disabled`: presigned URLs are turned off server-side (`WAVELET_DISABLE_PRESIGNED_URLS=1`) → play the same-origin /stream.
    // String status
    test('to test the property `status`', () async {
      // TODO
    });

  });
}
