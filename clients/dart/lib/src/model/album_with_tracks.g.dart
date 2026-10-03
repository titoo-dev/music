// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_with_tracks.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumWithTracks extends AlbumWithTracks {
  @override
  final BuiltList<AlbumTrack> tracks;
  @override
  final String id;
  @override
  final String userId;
  @override
  final String deezerAlbumId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? coverUrl;
  @override
  final int trackCount;
  @override
  final DateTime savedAt;

  factory _$AlbumWithTracks([void Function(AlbumWithTracksBuilder)? updates]) =>
      (AlbumWithTracksBuilder()..update(updates))._build();

  _$AlbumWithTracks._(
      {required this.tracks,
      required this.id,
      required this.userId,
      required this.deezerAlbumId,
      required this.title,
      required this.artist,
      this.coverUrl,
      required this.trackCount,
      required this.savedAt})
      : super._();
  @override
  AlbumWithTracks rebuild(void Function(AlbumWithTracksBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumWithTracksBuilder toBuilder() => AlbumWithTracksBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumWithTracks &&
        tracks == other.tracks &&
        id == other.id &&
        userId == other.userId &&
        deezerAlbumId == other.deezerAlbumId &&
        title == other.title &&
        artist == other.artist &&
        coverUrl == other.coverUrl &&
        trackCount == other.trackCount &&
        savedAt == other.savedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, deezerAlbumId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, trackCount.hashCode);
    _$hash = $jc(_$hash, savedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AlbumWithTracks')
          ..add('tracks', tracks)
          ..add('id', id)
          ..add('userId', userId)
          ..add('deezerAlbumId', deezerAlbumId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('coverUrl', coverUrl)
          ..add('trackCount', trackCount)
          ..add('savedAt', savedAt))
        .toString();
  }
}

class AlbumWithTracksBuilder
    implements Builder<AlbumWithTracks, AlbumWithTracksBuilder>, AlbumBuilder {
  _$AlbumWithTracks? _$v;

  ListBuilder<AlbumTrack>? _tracks;
  ListBuilder<AlbumTrack> get tracks =>
      _$this._tracks ??= ListBuilder<AlbumTrack>();
  set tracks(covariant ListBuilder<AlbumTrack>? tracks) =>
      _$this._tracks = tracks;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(covariant String? userId) => _$this._userId = userId;

  String? _deezerAlbumId;
  String? get deezerAlbumId => _$this._deezerAlbumId;
  set deezerAlbumId(covariant String? deezerAlbumId) =>
      _$this._deezerAlbumId = deezerAlbumId;

  String? _title;
  String? get title => _$this._title;
  set title(covariant String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(covariant String? artist) => _$this._artist = artist;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(covariant String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _trackCount;
  int? get trackCount => _$this._trackCount;
  set trackCount(covariant int? trackCount) => _$this._trackCount = trackCount;

  DateTime? _savedAt;
  DateTime? get savedAt => _$this._savedAt;
  set savedAt(covariant DateTime? savedAt) => _$this._savedAt = savedAt;

  AlbumWithTracksBuilder() {
    AlbumWithTracks._defaults(this);
  }

  AlbumWithTracksBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _id = $v.id;
      _userId = $v.userId;
      _deezerAlbumId = $v.deezerAlbumId;
      _title = $v.title;
      _artist = $v.artist;
      _coverUrl = $v.coverUrl;
      _trackCount = $v.trackCount;
      _savedAt = $v.savedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant AlbumWithTracks other) {
    _$v = other as _$AlbumWithTracks;
  }

  @override
  void update(void Function(AlbumWithTracksBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumWithTracks build() => _build();

  _$AlbumWithTracks _build() {
    _$AlbumWithTracks _$result;
    try {
      _$result = _$v ??
          _$AlbumWithTracks._(
            tracks: tracks.build(),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'AlbumWithTracks', 'id'),
            userId: BuiltValueNullFieldError.checkNotNull(
                userId, r'AlbumWithTracks', 'userId'),
            deezerAlbumId: BuiltValueNullFieldError.checkNotNull(
                deezerAlbumId, r'AlbumWithTracks', 'deezerAlbumId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'AlbumWithTracks', 'title'),
            artist: BuiltValueNullFieldError.checkNotNull(
                artist, r'AlbumWithTracks', 'artist'),
            coverUrl: coverUrl,
            trackCount: BuiltValueNullFieldError.checkNotNull(
                trackCount, r'AlbumWithTracks', 'trackCount'),
            savedAt: BuiltValueNullFieldError.checkNotNull(
                savedAt, r'AlbumWithTracks', 'savedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AlbumWithTracks', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
