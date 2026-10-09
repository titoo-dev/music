import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for SettingsApi
void main() {
  final instance = WaveletApi().getSettingsApi();

  group(SettingsApi, () {
    // UI preferences
    //
    //Future<UserPreferencesEnvelope> getPreferences() async
    test('test getPreferences', () async {
      // TODO
    });

    // Engine settings (per-user overrides merged over global)
    //
    // Signed in with stored overrides → `settings` is the global settings with the user's overrides merged on top; otherwise the global settings.
    //
    //Future<SettingsBundleEnvelope> getSettings() async
    test('test getSettings', () async {
      // TODO
    });

    // Server-wide streaming quality (maxBitrate)
    //
    // The one `maxBitrate` every stream uses (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Per-user `settings.maxBitrate` is not used for streaming.
    //
    //Future<StreamingQualityEnvelope> getStreamingQuality() async
    test('test getStreamingQuality', () async {
      // TODO
    });

    // Save the signed-in user's engine settings
    //
    // `settings` replaces the user's stored overrides (null → `{}`, i.e. back to the global settings; a body without `settings` is a 400 INVALID_BODY so it never wipes them by accident). Server-wide settings are never written here (the streaming quality has its own route). A `spotifySettings` field is ignored. The response's `settings` is the object as sent (not merged over the global settings), or the global settings when none was sent.
    //
    //Future<SettingsBundleEnvelope> saveSettings(SaveSettingsRequest saveSettingsRequest) async
    test('test saveSettings', () async {
      // TODO
    });

    // Change the server-wide streaming quality
    //
    // Applies to every listener. Tracks already cached keep the bitrate they were stored in. When `WAVELET_ADMIN_EMAILS` is set (comma-separated, case-insensitive), only those accounts may change it — anyone else gets 403 `FORBIDDEN`; when it is unset or empty, any signed-in user may.
    //
    //Future<StreamingQualityEnvelope> setStreamingQuality(SetStreamingQualityRequest setStreamingQualityRequest) async
    test('test setStreamingQuality', () async {
      // TODO
    });

    // Merge UI preferences (unknown keys → 400)
    //
    //Future<UserPreferencesEnvelope> updatePreferences(UserPreferences userPreferences) async
    test('test updatePreferences', () async {
      // TODO
    });

  });
}
