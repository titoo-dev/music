// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'followed_artist_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowedArtistEnvelope extends FollowedArtistEnvelope {
  @override
  final bool success;
  @override
  final FollowedArtistEnvelopeData data;

  factory _$FollowedArtistEnvelope(
          [void Function(FollowedArtistEnvelopeBuilder)? updates]) =>
      (FollowedArtistEnvelopeBuilder()..update(updates))._build();

  _$FollowedArtistEnvelope._({required this.success, required this.data})
      : super._();
  @override
  FollowedArtistEnvelope rebuild(
          void Function(FollowedArtistEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowedArtistEnvelopeBuilder toBuilder() =>
      FollowedArtistEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowedArtistEnvelope &&
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
    return (newBuiltValueToStringHelper(r'FollowedArtistEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class FollowedArtistEnvelopeBuilder
    implements Builder<FollowedArtistEnvelope, FollowedArtistEnvelopeBuilder> {
  _$FollowedArtistEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  FollowedArtistEnvelopeDataBuilder? _data;
  FollowedArtistEnvelopeDataBuilder get data =>
      _$this._data ??= FollowedArtistEnvelopeDataBuilder();
  set data(FollowedArtistEnvelopeDataBuilder? data) => _$this._data = data;

  FollowedArtistEnvelopeBuilder() {
    FollowedArtistEnvelope._defaults(this);
  }

  FollowedArtistEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowedArtistEnvelope other) {
    _$v = other as _$FollowedArtistEnvelope;
  }

  @override
  void update(void Function(FollowedArtistEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowedArtistEnvelope build() => _build();

  _$FollowedArtistEnvelope _build() {
    _$FollowedArtistEnvelope _$result;
    try {
      _$result = _$v ??
          _$FollowedArtistEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'FollowedArtistEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FollowedArtistEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
