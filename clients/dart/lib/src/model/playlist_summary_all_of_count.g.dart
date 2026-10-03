// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_summary_all_of_count.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistSummaryAllOfCount extends PlaylistSummaryAllOfCount {
  @override
  final int tracks;

  factory _$PlaylistSummaryAllOfCount(
          [void Function(PlaylistSummaryAllOfCountBuilder)? updates]) =>
      (PlaylistSummaryAllOfCountBuilder()..update(updates))._build();

  _$PlaylistSummaryAllOfCount._({required this.tracks}) : super._();
  @override
  PlaylistSummaryAllOfCount rebuild(
          void Function(PlaylistSummaryAllOfCountBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistSummaryAllOfCountBuilder toBuilder() =>
      PlaylistSummaryAllOfCountBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistSummaryAllOfCount && tracks == other.tracks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PlaylistSummaryAllOfCount')
          ..add('tracks', tracks))
        .toString();
  }
}

class PlaylistSummaryAllOfCountBuilder
    implements
        Builder<PlaylistSummaryAllOfCount, PlaylistSummaryAllOfCountBuilder> {
  _$PlaylistSummaryAllOfCount? _$v;

  int? _tracks;
  int? get tracks => _$this._tracks;
  set tracks(int? tracks) => _$this._tracks = tracks;

  PlaylistSummaryAllOfCountBuilder() {
    PlaylistSummaryAllOfCount._defaults(this);
  }

  PlaylistSummaryAllOfCountBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PlaylistSummaryAllOfCount other) {
    _$v = other as _$PlaylistSummaryAllOfCount;
  }

  @override
  void update(void Function(PlaylistSummaryAllOfCountBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistSummaryAllOfCount build() => _build();

  _$PlaylistSummaryAllOfCount _build() {
    final _$result = _$v ??
        _$PlaylistSummaryAllOfCount._(
          tracks: BuiltValueNullFieldError.checkNotNull(
              tracks, r'PlaylistSummaryAllOfCount', 'tracks'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
