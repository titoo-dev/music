// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'save_settings_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SaveSettingsRequest extends SaveSettingsRequest {
  @override
  final BuiltMap<String, JsonObject?>? settings;

  factory _$SaveSettingsRequest(
          [void Function(SaveSettingsRequestBuilder)? updates]) =>
      (SaveSettingsRequestBuilder()..update(updates))._build();

  _$SaveSettingsRequest._({this.settings}) : super._();
  @override
  SaveSettingsRequest rebuild(
          void Function(SaveSettingsRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SaveSettingsRequestBuilder toBuilder() =>
      SaveSettingsRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SaveSettingsRequest && settings == other.settings;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, settings.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SaveSettingsRequest')
          ..add('settings', settings))
        .toString();
  }
}

class SaveSettingsRequestBuilder
    implements Builder<SaveSettingsRequest, SaveSettingsRequestBuilder> {
  _$SaveSettingsRequest? _$v;

  MapBuilder<String, JsonObject?>? _settings;
  MapBuilder<String, JsonObject?> get settings =>
      _$this._settings ??= MapBuilder<String, JsonObject?>();
  set settings(MapBuilder<String, JsonObject?>? settings) =>
      _$this._settings = settings;

  SaveSettingsRequestBuilder() {
    SaveSettingsRequest._defaults(this);
  }

  SaveSettingsRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _settings = $v.settings?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SaveSettingsRequest other) {
    _$v = other as _$SaveSettingsRequest;
  }

  @override
  void update(void Function(SaveSettingsRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SaveSettingsRequest build() => _build();

  _$SaveSettingsRequest _build() {
    _$SaveSettingsRequest _$result;
    try {
      _$result = _$v ??
          _$SaveSettingsRequest._(
            settings: _settings?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'settings';
        _settings?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SaveSettingsRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
