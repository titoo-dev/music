// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_login_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerLoginEnvelope extends DeezerLoginEnvelope {
  @override
  final bool success;
  @override
  final DeezerLoginResult data;

  factory _$DeezerLoginEnvelope(
          [void Function(DeezerLoginEnvelopeBuilder)? updates]) =>
      (DeezerLoginEnvelopeBuilder()..update(updates))._build();

  _$DeezerLoginEnvelope._({required this.success, required this.data})
      : super._();
  @override
  DeezerLoginEnvelope rebuild(
          void Function(DeezerLoginEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerLoginEnvelopeBuilder toBuilder() =>
      DeezerLoginEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerLoginEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeezerLoginEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeezerLoginEnvelopeBuilder
    implements Builder<DeezerLoginEnvelope, DeezerLoginEnvelopeBuilder> {
  _$DeezerLoginEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  DeezerLoginResultBuilder? _data;
  DeezerLoginResultBuilder get data =>
      _$this._data ??= DeezerLoginResultBuilder();
  set data(DeezerLoginResultBuilder? data) => _$this._data = data;

  DeezerLoginEnvelopeBuilder() {
    DeezerLoginEnvelope._defaults(this);
  }

  DeezerLoginEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerLoginEnvelope other) {
    _$v = other as _$DeezerLoginEnvelope;
  }

  @override
  void update(void Function(DeezerLoginEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerLoginEnvelope build() => _build();

  _$DeezerLoginEnvelope _build() {
    _$DeezerLoginEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeezerLoginEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeezerLoginEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerLoginEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
