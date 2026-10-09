// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_track_batch_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyTrackBatchEnvelope extends SpotifyTrackBatchEnvelope {
  @override
  final bool success;
  @override
  final SpotifyTrackBatch data;

  factory _$SpotifyTrackBatchEnvelope(
          [void Function(SpotifyTrackBatchEnvelopeBuilder)? updates]) =>
      (SpotifyTrackBatchEnvelopeBuilder()..update(updates))._build();

  _$SpotifyTrackBatchEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SpotifyTrackBatchEnvelope rebuild(
          void Function(SpotifyTrackBatchEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyTrackBatchEnvelopeBuilder toBuilder() =>
      SpotifyTrackBatchEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyTrackBatchEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SpotifyTrackBatchEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SpotifyTrackBatchEnvelopeBuilder
    implements
        Builder<SpotifyTrackBatchEnvelope, SpotifyTrackBatchEnvelopeBuilder> {
  _$SpotifyTrackBatchEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SpotifyTrackBatchBuilder? _data;
  SpotifyTrackBatchBuilder get data =>
      _$this._data ??= SpotifyTrackBatchBuilder();
  set data(SpotifyTrackBatchBuilder? data) => _$this._data = data;

  SpotifyTrackBatchEnvelopeBuilder() {
    SpotifyTrackBatchEnvelope._defaults(this);
  }

  SpotifyTrackBatchEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyTrackBatchEnvelope other) {
    _$v = other as _$SpotifyTrackBatchEnvelope;
  }

  @override
  void update(void Function(SpotifyTrackBatchEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyTrackBatchEnvelope build() => _build();

  _$SpotifyTrackBatchEnvelope _build() {
    _$SpotifyTrackBatchEnvelope _$result;
    try {
      _$result = _$v ??
          _$SpotifyTrackBatchEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SpotifyTrackBatchEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyTrackBatchEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
