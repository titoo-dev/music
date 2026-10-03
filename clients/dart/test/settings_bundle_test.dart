import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for SettingsBundle
void main() {
  final instance = SettingsBundleBuilder();
  // TODO add properties to the builder and call build()

  group(SettingsBundle, () {
    // Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
    // BuiltMap<String, JsonObject> settings
    test('to test the property `settings`', () async {
      // TODO
    });

    // Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
    // BuiltMap<String, JsonObject> defaultSettings
    test('to test the property `defaultSettings`', () async {
      // TODO
    });

    // Spotify plugin settings (may be absent).
    // BuiltMap<String, JsonObject> spotifySettings
    test('to test the property `spotifySettings`', () async {
      // TODO
    });

  });
}
