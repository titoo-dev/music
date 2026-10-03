import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for DeezerTracklistEnvelope
void main() {
  final instance = DeezerTracklistEnvelopeBuilder();
  // TODO add properties to the builder and call build()

  group(DeezerTracklistEnvelope, () {
    // bool success
    test('to test the property `success`', () async {
      // TODO
    });

    // Raw Deezer GW payload. `type=album` → album page + `tracks[]`; `type=playlist` → playlist page + `tracks[]`; `type=artist` → artist page + `topTracks[]` + `discography`. GW objects use uppercase keys (SNG_ID, ALB_ID, ART_ID, …).
    // BuiltMap<String, JsonObject> data
    test('to test the property `data`', () async {
      // TODO
    });

  });
}
