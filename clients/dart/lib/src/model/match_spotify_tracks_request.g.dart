// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'match_spotify_tracks_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MatchSpotifyTracksRequest extends MatchSpotifyTracksRequest {
  @override
  final BuiltList<SpotifyTrack> tracks;

  factory _$MatchSpotifyTracksRequest(
          [void Function(MatchSpotifyTracksRequestBuilder)? updates]) =>
      (MatchSpotifyTracksRequestBuilder()..update(updates))._build();

  _$MatchSpotifyTracksRequest._({required this.tracks}) : super._();
  @override
  MatchSpotifyTracksRequest rebuild(
          void Function(MatchSpotifyTracksRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MatchSpotifyTracksRequestBuilder toBuilder() =>
      MatchSpotifyTracksRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MatchSpotifyTracksRequest && tracks == other.tracks;
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
    return (newBuiltValueToStringHelper(r'MatchSpotifyTracksRequest')
          ..add('tracks', tracks))
        .toString();
  }
}

class MatchSpotifyTracksRequestBuilder
    implements
        Builder<MatchSpotifyTracksRequest, MatchSpotifyTracksRequestBuilder> {
  _$MatchSpotifyTracksRequest? _$v;

  ListBuilder<SpotifyTrack>? _tracks;
  ListBuilder<SpotifyTrack> get tracks =>
      _$this._tracks ??= ListBuilder<SpotifyTrack>();
  set tracks(ListBuilder<SpotifyTrack>? tracks) => _$this._tracks = tracks;

  MatchSpotifyTracksRequestBuilder() {
    MatchSpotifyTracksRequest._defaults(this);
  }

  MatchSpotifyTracksRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MatchSpotifyTracksRequest other) {
    _$v = other as _$MatchSpotifyTracksRequest;
  }

  @override
  void update(void Function(MatchSpotifyTracksRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MatchSpotifyTracksRequest build() => _build();

  _$MatchSpotifyTracksRequest _build() {
    _$MatchSpotifyTracksRequest _$result;
    try {
      _$result = _$v ??
          _$MatchSpotifyTracksRequest._(
            tracks: tracks.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'MatchSpotifyTracksRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
