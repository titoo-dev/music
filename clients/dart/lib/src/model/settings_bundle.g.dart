// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_bundle.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SettingsBundle extends SettingsBundle {
  @override
  final BuiltMap<String, JsonObject?> settings;
  @override
  final BuiltMap<String, JsonObject?> defaultSettings;
  @override
  final BuiltMap<String, JsonObject?>? spotifySettings;

  factory _$SettingsBundle([void Function(SettingsBundleBuilder)? updates]) =>
      (SettingsBundleBuilder()..update(updates))._build();

  _$SettingsBundle._(
      {required this.settings,
      required this.defaultSettings,
      this.spotifySettings})
      : super._();
  @override
  SettingsBundle rebuild(void Function(SettingsBundleBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SettingsBundleBuilder toBuilder() => SettingsBundleBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SettingsBundle &&
        settings == other.settings &&
        defaultSettings == other.defaultSettings &&
        spotifySettings == other.spotifySettings;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, settings.hashCode);
    _$hash = $jc(_$hash, defaultSettings.hashCode);
    _$hash = $jc(_$hash, spotifySettings.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SettingsBundle')
          ..add('settings', settings)
          ..add('defaultSettings', defaultSettings)
          ..add('spotifySettings', spotifySettings))
        .toString();
  }
}

class SettingsBundleBuilder
    implements Builder<SettingsBundle, SettingsBundleBuilder> {
  _$SettingsBundle? _$v;

  MapBuilder<String, JsonObject?>? _settings;
  MapBuilder<String, JsonObject?> get settings =>
      _$this._settings ??= MapBuilder<String, JsonObject?>();
  set settings(MapBuilder<String, JsonObject?>? settings) =>
      _$this._settings = settings;

  MapBuilder<String, JsonObject?>? _defaultSettings;
  MapBuilder<String, JsonObject?> get defaultSettings =>
      _$this._defaultSettings ??= MapBuilder<String, JsonObject?>();
  set defaultSettings(MapBuilder<String, JsonObject?>? defaultSettings) =>
      _$this._defaultSettings = defaultSettings;

  MapBuilder<String, JsonObject?>? _spotifySettings;
  MapBuilder<String, JsonObject?> get spotifySettings =>
      _$this._spotifySettings ??= MapBuilder<String, JsonObject?>();
  set spotifySettings(MapBuilder<String, JsonObject?>? spotifySettings) =>
      _$this._spotifySettings = spotifySettings;

  SettingsBundleBuilder() {
    SettingsBundle._defaults(this);
  }

  SettingsBundleBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _settings = $v.settings.toBuilder();
      _defaultSettings = $v.defaultSettings.toBuilder();
      _spotifySettings = $v.spotifySettings?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SettingsBundle other) {
    _$v = other as _$SettingsBundle;
  }

  @override
  void update(void Function(SettingsBundleBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SettingsBundle build() => _build();

  _$SettingsBundle _build() {
    _$SettingsBundle _$result;
    try {
      _$result = _$v ??
          _$SettingsBundle._(
            settings: settings.build(),
            defaultSettings: defaultSettings.build(),
            spotifySettings: _spotifySettings?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'settings';
        settings.build();
        _$failedField = 'defaultSettings';
        defaultSettings.build();
        _$failedField = 'spotifySettings';
        _spotifySettings?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SettingsBundle', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
