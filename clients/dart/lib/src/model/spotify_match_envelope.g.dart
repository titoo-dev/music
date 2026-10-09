// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_match_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyMatchEnvelope extends SpotifyMatchEnvelope {
  @override
  final bool success;
  @override
  final SpotifyMatchEnvelopeData data;

  factory _$SpotifyMatchEnvelope(
          [void Function(SpotifyMatchEnvelopeBuilder)? updates]) =>
      (SpotifyMatchEnvelopeBuilder()..update(updates))._build();

  _$SpotifyMatchEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SpotifyMatchEnvelope rebuild(
          void Function(SpotifyMatchEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyMatchEnvelopeBuilder toBuilder() =>
      SpotifyMatchEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyMatchEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SpotifyMatchEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SpotifyMatchEnvelopeBuilder
    implements Builder<SpotifyMatchEnvelope, SpotifyMatchEnvelopeBuilder> {
  _$SpotifyMatchEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SpotifyMatchEnvelopeDataBuilder? _data;
  SpotifyMatchEnvelopeDataBuilder get data =>
      _$this._data ??= SpotifyMatchEnvelopeDataBuilder();
  set data(SpotifyMatchEnvelopeDataBuilder? data) => _$this._data = data;

  SpotifyMatchEnvelopeBuilder() {
    SpotifyMatchEnvelope._defaults(this);
  }

  SpotifyMatchEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyMatchEnvelope other) {
    _$v = other as _$SpotifyMatchEnvelope;
  }

  @override
  void update(void Function(SpotifyMatchEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyMatchEnvelope build() => _build();

  _$SpotifyMatchEnvelope _build() {
    _$SpotifyMatchEnvelope _$result;
    try {
      _$result = _$v ??
          _$SpotifyMatchEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SpotifyMatchEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyMatchEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
