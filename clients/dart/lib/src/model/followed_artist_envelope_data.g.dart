// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'followed_artist_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowedArtistEnvelopeData extends FollowedArtistEnvelopeData {
  @override
  final FollowedArtist followed;

  factory _$FollowedArtistEnvelopeData(
          [void Function(FollowedArtistEnvelopeDataBuilder)? updates]) =>
      (FollowedArtistEnvelopeDataBuilder()..update(updates))._build();

  _$FollowedArtistEnvelopeData._({required this.followed}) : super._();
  @override
  FollowedArtistEnvelopeData rebuild(
          void Function(FollowedArtistEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowedArtistEnvelopeDataBuilder toBuilder() =>
      FollowedArtistEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowedArtistEnvelopeData && followed == other.followed;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, followed.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FollowedArtistEnvelopeData')
          ..add('followed', followed))
        .toString();
  }
}

class FollowedArtistEnvelopeDataBuilder
    implements
        Builder<FollowedArtistEnvelopeData, FollowedArtistEnvelopeDataBuilder> {
  _$FollowedArtistEnvelopeData? _$v;

  FollowedArtistBuilder? _followed;
  FollowedArtistBuilder get followed =>
      _$this._followed ??= FollowedArtistBuilder();
  set followed(FollowedArtistBuilder? followed) => _$this._followed = followed;

  FollowedArtistEnvelopeDataBuilder() {
    FollowedArtistEnvelopeData._defaults(this);
  }

  FollowedArtistEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _followed = $v.followed.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowedArtistEnvelopeData other) {
    _$v = other as _$FollowedArtistEnvelopeData;
  }

  @override
  void update(void Function(FollowedArtistEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowedArtistEnvelopeData build() => _build();

  _$FollowedArtistEnvelopeData _build() {
    _$FollowedArtistEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$FollowedArtistEnvelopeData._(
            followed: followed.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'followed';
        followed.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FollowedArtistEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
