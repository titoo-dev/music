// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_user_loved_tracks.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerUserLovedTracks extends DeezerUserLovedTracks {
  @override
  final OneOf oneOf;

  factory _$DeezerUserLovedTracks(
          [void Function(DeezerUserLovedTracksBuilder)? updates]) =>
      (DeezerUserLovedTracksBuilder()..update(updates))._build();

  _$DeezerUserLovedTracks._({required this.oneOf}) : super._();
  @override
  DeezerUserLovedTracks rebuild(
          void Function(DeezerUserLovedTracksBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerUserLovedTracksBuilder toBuilder() =>
      DeezerUserLovedTracksBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerUserLovedTracks && oneOf == other.oneOf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oneOf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeezerUserLovedTracks')
          ..add('oneOf', oneOf))
        .toString();
  }
}

class DeezerUserLovedTracksBuilder
    implements Builder<DeezerUserLovedTracks, DeezerUserLovedTracksBuilder> {
  _$DeezerUserLovedTracks? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  DeezerUserLovedTracksBuilder() {
    DeezerUserLovedTracks._defaults(this);
  }

  DeezerUserLovedTracksBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerUserLovedTracks other) {
    _$v = other as _$DeezerUserLovedTracks;
  }

  @override
  void update(void Function(DeezerUserLovedTracksBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerUserLovedTracks build() => _build();

  _$DeezerUserLovedTracks _build() {
    final _$result = _$v ??
        _$DeezerUserLovedTracks._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
              oneOf, r'DeezerUserLovedTracks', 'oneOf'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
