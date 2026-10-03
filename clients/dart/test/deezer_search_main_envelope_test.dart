import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for DeezerSearchMainEnvelope
void main() {
  final instance = DeezerSearchMainEnvelopeBuilder();
  // TODO add properties to the builder and call build()

  group(DeezerSearchMainEnvelope, () {
    // bool success
    test('to test the property `success`', () async {
      // TODO
    });

    // Merged GW search payload with `TRACK`, `ALBUM`, `ARTIST`, `PLAYLIST`, `TOP_RESULT`, `ORDER`, … Each bucket is `{ data: [], count }`. Items are GW objects (uppercase keys) possibly mixed with public-API objects (lowercase keys) appended for extra coverage.
    // BuiltMap<String, JsonObject> data
    test('to test the property `data`', () async {
      // TODO
    });

  });
}
