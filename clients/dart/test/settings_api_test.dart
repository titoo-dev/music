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
    //Future<SettingsBundleEnvelope> getSettings() async
    test('test getSettings', () async {
      // TODO
    });

    // Save engine settings
    //
    // `settings` is stored per-user (replaces the previous object) when authenticated. `spotifySettings` is global.
    //
    //Future<SettingsBundleEnvelope> saveSettings(SaveSettingsRequest saveSettingsRequest) async
    test('test saveSettings', () async {
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
