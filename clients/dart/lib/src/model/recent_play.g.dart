// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recent_play.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentPlay extends RecentPlay {
  @override
  final String id;
  @override
  final String userId;
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
  final DateTime playedAt;

  factory _$RecentPlay([void Function(RecentPlayBuilder)? updates]) =>
      (RecentPlayBuilder()..update(updates))._build();

  _$RecentPlay._(
      {required this.id,
      required this.userId,
      required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration,
      required this.playedAt})
      : super._();
  @override
  RecentPlay rebuild(void Function(RecentPlayBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecentPlayBuilder toBuilder() => RecentPlayBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentPlay &&
        id == other.id &&
        userId == other.userId &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        albumId == other.albumId &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        playedAt == other.playedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, playedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RecentPlay')
          ..add('id', id)
          ..add('userId', userId)
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('playedAt', playedAt))
        .toString();
  }
}

class RecentPlayBuilder implements Builder<RecentPlay, RecentPlayBuilder> {
  _$RecentPlay? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

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

  DateTime? _playedAt;
  DateTime? get playedAt => _$this._playedAt;
  set playedAt(DateTime? playedAt) => _$this._playedAt = playedAt;

  RecentPlayBuilder() {
    RecentPlay._defaults(this);
  }

  RecentPlayBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _trackId = $v.trackId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _albumId = $v.albumId;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _playedAt = $v.playedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentPlay other) {
    _$v = other as _$RecentPlay;
  }

  @override
  void update(void Function(RecentPlayBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentPlay build() => _build();

  _$RecentPlay _build() {
    final _$result = _$v ??
        _$RecentPlay._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'RecentPlay', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'RecentPlay', 'userId'),
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'RecentPlay', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'RecentPlay', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'RecentPlay', 'artist'),
          album: album,
          albumId: albumId,
          coverUrl: coverUrl,
          duration: duration,
          playedAt: BuiltValueNullFieldError.checkNotNull(
              playedAt, r'RecentPlay', 'playedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
