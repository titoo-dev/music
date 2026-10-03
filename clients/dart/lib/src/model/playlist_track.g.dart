// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistTrack extends PlaylistTrack {
  @override
  final String id;
  @override
  final String playlistId;
  @override
  final String trackId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? album;
  @override
  final String? albumId;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final int position;
  @override
  final DateTime addedAt;

  factory _$PlaylistTrack([void Function(PlaylistTrackBuilder)? updates]) =>
      (PlaylistTrackBuilder()..update(updates))._build();

  _$PlaylistTrack._(
      {required this.id,
      required this.playlistId,
      required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration,
      required this.position,
      required this.addedAt})
      : super._();
  @override
  PlaylistTrack rebuild(void Function(PlaylistTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistTrackBuilder toBuilder() => PlaylistTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistTrack &&
        id == other.id &&
        playlistId == other.playlistId &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        albumId == other.albumId &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        position == other.position &&
        addedAt == other.addedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, playlistId.hashCode);
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, addedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PlaylistTrack')
          ..add('id', id)
          ..add('playlistId', playlistId)
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('position', position)
          ..add('addedAt', addedAt))
        .toString();
  }
}

class PlaylistTrackBuilder
    implements Builder<PlaylistTrack, PlaylistTrackBuilder> {
  _$PlaylistTrack? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _playlistId;
  String? get playlistId => _$this._playlistId;
  set playlistId(String? playlistId) => _$this._playlistId = playlistId;

  String? _trackId;
  String? get trackId => _$this._trackId;
  set trackId(String? trackId) => _$this._trackId = trackId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _albumId;
  String? get albumId => _$this._albumId;
  set albumId(String? albumId) => _$this._albumId = albumId;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  DateTime? _addedAt;
  DateTime? get addedAt => _$this._addedAt;
  set addedAt(DateTime? addedAt) => _$this._addedAt = addedAt;

  PlaylistTrackBuilder() {
    PlaylistTrack._defaults(this);
  }

  PlaylistTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _playlistId = $v.playlistId;
      _trackId = $v.trackId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _albumId = $v.albumId;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _position = $v.position;
      _addedAt = $v.addedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PlaylistTrack other) {
    _$v = other as _$PlaylistTrack;
  }

  @override
  void update(void Function(PlaylistTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistTrack build() => _build();

  _$PlaylistTrack _build() {
    final _$result = _$v ??
        _$PlaylistTrack._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'PlaylistTrack', 'id'),
          playlistId: BuiltValueNullFieldError.checkNotNull(
              playlistId, r'PlaylistTrack', 'playlistId'),
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'PlaylistTrack', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'PlaylistTrack', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'PlaylistTrack', 'artist'),
          album: album,
          albumId: albumId,
          coverUrl: coverUrl,
          duration: duration,
          position: BuiltValueNullFieldError.checkNotNull(
              position, r'PlaylistTrack', 'position'),
          addedAt: BuiltValueNullFieldError.checkNotNull(
              addedAt, r'PlaylistTrack', 'addedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
