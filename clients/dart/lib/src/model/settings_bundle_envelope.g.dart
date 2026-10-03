// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_bundle_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SettingsBundleEnvelope extends SettingsBundleEnvelope {
  @override
  final bool success;
  @override
  final SettingsBundle data;

  factory _$SettingsBundleEnvelope(
          [void Function(SettingsBundleEnvelopeBuilder)? updates]) =>
      (SettingsBundleEnvelopeBuilder()..update(updates))._build();

  _$SettingsBundleEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SettingsBundleEnvelope rebuild(
          void Function(SettingsBundleEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SettingsBundleEnvelopeBuilder toBuilder() =>
      SettingsBundleEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SettingsBundleEnvelope &&
        success == other.success &&
        data == other.data;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SettingsBundleEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SettingsBundleEnvelopeBuilder
    implements Builder<SettingsBundleEnvelope, SettingsBundleEnvelopeBuilder> {
  _$SettingsBundleEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SettingsBundleBuilder? _data;
  SettingsBundleBuilder get data => _$this._data ??= SettingsBundleBuilder();
  set data(SettingsBundleBuilder? data) => _$this._data = data;

  SettingsBundleEnvelopeBuilder() {
    SettingsBundleEnvelope._defaults(this);
  }

  SettingsBundleEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SettingsBundleEnvelope other) {
    _$v = other as _$SettingsBundleEnvelope;
  }

  @override
  void update(void Function(SettingsBundleEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SettingsBundleEnvelope build() => _build();

  _$SettingsBundleEnvelope _build() {
    _$SettingsBundleEnvelope _$result;
    try {
      _$result = _$v ??
          _$SettingsBundleEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SettingsBundleEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SettingsBundleEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
