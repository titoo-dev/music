// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_save_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifySaveEnvelope extends SpotifySaveEnvelope {
  @override
  final bool success;
  @override
  final SpotifySaveEnvelopeData data;

  factory _$SpotifySaveEnvelope(
          [void Function(SpotifySaveEnvelopeBuilder)? updates]) =>
      (SpotifySaveEnvelopeBuilder()..update(updates))._build();

  _$SpotifySaveEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SpotifySaveEnvelope rebuild(
          void Function(SpotifySaveEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifySaveEnvelopeBuilder toBuilder() =>
      SpotifySaveEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifySaveEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SpotifySaveEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SpotifySaveEnvelopeBuilder
    implements Builder<SpotifySaveEnvelope, SpotifySaveEnvelopeBuilder> {
  _$SpotifySaveEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SpotifySaveEnvelopeDataBuilder? _data;
  SpotifySaveEnvelopeDataBuilder get data =>
      _$this._data ??= SpotifySaveEnvelopeDataBuilder();
  set data(SpotifySaveEnvelopeDataBuilder? data) => _$this._data = data;

  SpotifySaveEnvelopeBuilder() {
    SpotifySaveEnvelope._defaults(this);
  }

  SpotifySaveEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifySaveEnvelope other) {
    _$v = other as _$SpotifySaveEnvelope;
  }

  @override
  void update(void Function(SpotifySaveEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifySaveEnvelope build() => _build();

  _$SpotifySaveEnvelope _build() {
    _$SpotifySaveEnvelope _$result;
    try {
      _$result = _$v ??
          _$SpotifySaveEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SpotifySaveEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifySaveEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
