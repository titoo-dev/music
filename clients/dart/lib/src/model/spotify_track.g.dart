// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyTrack extends SpotifyTrack {
  @override
  final String spotifyId;
  @override
  final String title;
  @override
  final BuiltList<String> artists;
  @override
  final String? album;
  @override
  final String? albumId;
  @override
  final int durationMs;
  @override
  final String? isrc;
  @override
  final String? coverUrl;

  factory _$SpotifyTrack([void Function(SpotifyTrackBuilder)? updates]) =>
      (SpotifyTrackBuilder()..update(updates))._build();

  _$SpotifyTrack._(
      {required this.spotifyId,
      required this.title,
      required this.artists,
      this.album,
      this.albumId,
      required this.durationMs,
      this.isrc,
      this.coverUrl})
      : super._();
  @override
  SpotifyTrack rebuild(void Function(SpotifyTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyTrackBuilder toBuilder() => SpotifyTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyTrack &&
        spotifyId == other.spotifyId &&
        title == other.title &&
        artists == other.artists &&
        album == other.album &&
        albumId == other.albumId &&
        durationMs == other.durationMs &&
        isrc == other.isrc &&
        coverUrl == other.coverUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, spotifyId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artists.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, durationMs.hashCode);
    _$hash = $jc(_$hash, isrc.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyTrack')
          ..add('spotifyId', spotifyId)
          ..add('title', title)
          ..add('artists', artists)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('durationMs', durationMs)
          ..add('isrc', isrc)
          ..add('coverUrl', coverUrl))
        .toString();
  }
}

class SpotifyTrackBuilder
    implements Builder<SpotifyTrack, SpotifyTrackBuilder> {
  _$SpotifyTrack? _$v;

  String? _spotifyId;
  String? get spotifyId => _$this._spotifyId;
  set spotifyId(String? spotifyId) => _$this._spotifyId = spotifyId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  ListBuilder<String>? _artists;
  ListBuilder<String> get artists => _$this._artists ??= ListBuilder<String>();
  set artists(ListBuilder<String>? artists) => _$this._artists = artists;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _albumId;
  String? get albumId => _$this._albumId;
  set albumId(String? albumId) => _$this._albumId = albumId;

  int? _durationMs;
  int? get durationMs => _$this._durationMs;
  set durationMs(int? durationMs) => _$this._durationMs = durationMs;

  String? _isrc;
  String? get isrc => _$this._isrc;
  set isrc(String? isrc) => _$this._isrc = isrc;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  SpotifyTrackBuilder() {
    SpotifyTrack._defaults(this);
  }

  SpotifyTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _spotifyId = $v.spotifyId;
      _title = $v.title;
      _artists = $v.artists.toBuilder();
      _album = $v.album;
      _albumId = $v.albumId;
      _durationMs = $v.durationMs;
      _isrc = $v.isrc;
      _coverUrl = $v.coverUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyTrack other) {
    _$v = other as _$SpotifyTrack;
  }

  @override
  void update(void Function(SpotifyTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyTrack build() => _build();

  _$SpotifyTrack _build() {
    _$SpotifyTrack _$result;
    try {
      _$result = _$v ??
          _$SpotifyTrack._(
            spotifyId: BuiltValueNullFieldError.checkNotNull(
                spotifyId, r'SpotifyTrack', 'spotifyId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'SpotifyTrack', 'title'),
            artists: artists.build(),
            album: album,
            albumId: albumId,
            durationMs: BuiltValueNullFieldError.checkNotNull(
                durationMs, r'SpotifyTrack', 'durationMs'),
            isrc: isrc,
            coverUrl: coverUrl,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'artists';
        artists.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyTrack', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
