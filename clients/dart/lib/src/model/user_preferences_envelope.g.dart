// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_preferences_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserPreferencesEnvelope extends UserPreferencesEnvelope {
  @override
  final bool success;
  @override
  final UserPreferences data;

  factory _$UserPreferencesEnvelope(
          [void Function(UserPreferencesEnvelopeBuilder)? updates]) =>
      (UserPreferencesEnvelopeBuilder()..update(updates))._build();

  _$UserPreferencesEnvelope._({required this.success, required this.data})
      : super._();
  @override
  UserPreferencesEnvelope rebuild(
          void Function(UserPreferencesEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserPreferencesEnvelopeBuilder toBuilder() =>
      UserPreferencesEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserPreferencesEnvelope &&
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
    return (newBuiltValueToStringHelper(r'UserPreferencesEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class UserPreferencesEnvelopeBuilder
    implements
        Builder<UserPreferencesEnvelope, UserPreferencesEnvelopeBuilder> {
  _$UserPreferencesEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  UserPreferencesBuilder? _data;
  UserPreferencesBuilder get data => _$this._data ??= UserPreferencesBuilder();
  set data(UserPreferencesBuilder? data) => _$this._data = data;

  UserPreferencesEnvelopeBuilder() {
    UserPreferencesEnvelope._defaults(this);
  }

  UserPreferencesEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserPreferencesEnvelope other) {
    _$v = other as _$UserPreferencesEnvelope;
  }

  @override
  void update(void Function(UserPreferencesEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserPreferencesEnvelope build() => _build();

  _$UserPreferencesEnvelope _build() {
    _$UserPreferencesEnvelope _$result;
    try {
      _$result = _$v ??
          _$UserPreferencesEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'UserPreferencesEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UserPreferencesEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
