// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'followed_artist_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowedArtistListEnvelope extends FollowedArtistListEnvelope {
  @override
  final bool success;
  @override
  final FollowedArtistListEnvelopeData data;

  factory _$FollowedArtistListEnvelope(
          [void Function(FollowedArtistListEnvelopeBuilder)? updates]) =>
      (FollowedArtistListEnvelopeBuilder()..update(updates))._build();

  _$FollowedArtistListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  FollowedArtistListEnvelope rebuild(
          void Function(FollowedArtistListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowedArtistListEnvelopeBuilder toBuilder() =>
      FollowedArtistListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowedArtistListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'FollowedArtistListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class FollowedArtistListEnvelopeBuilder
    implements
        Builder<FollowedArtistListEnvelope, FollowedArtistListEnvelopeBuilder> {
  _$FollowedArtistListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  FollowedArtistListEnvelopeDataBuilder? _data;
  FollowedArtistListEnvelopeDataBuilder get data =>
      _$this._data ??= FollowedArtistListEnvelopeDataBuilder();
  set data(FollowedArtistListEnvelopeDataBuilder? data) => _$this._data = data;

  FollowedArtistListEnvelopeBuilder() {
    FollowedArtistListEnvelope._defaults(this);
  }

  FollowedArtistListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowedArtistListEnvelope other) {
    _$v = other as _$FollowedArtistListEnvelope;
  }

  @override
  void update(void Function(FollowedArtistListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowedArtistListEnvelope build() => _build();

  _$FollowedArtistListEnvelope _build() {
    _$FollowedArtistListEnvelope _$result;
    try {
      _$result = _$v ??
          _$FollowedArtistListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'FollowedArtistListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FollowedArtistListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
