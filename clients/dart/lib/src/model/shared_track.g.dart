// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SharedTrack extends SharedTrack {
  @override
  final String id;
  @override
  final String shareId;
  @override
  final String trackId;
  @override
  final String userId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? album;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final String? storedTrackId;
  @override
  final DateTime? expiresAt;
  @override
  final int plays;
  @override
  final DateTime createdAt;

  factory _$SharedTrack([void Function(SharedTrackBuilder)? updates]) =>
      (SharedTrackBuilder()..update(updates))._build();

  _$SharedTrack._(
      {required this.id,
      required this.shareId,
      required this.trackId,
      required this.userId,
      required this.title,
      required this.artist,
      this.album,
      this.coverUrl,
      this.duration,
      this.storedTrackId,
      this.expiresAt,
      required this.plays,
      required this.createdAt})
      : super._();
  @override
  SharedTrack rebuild(void Function(SharedTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SharedTrackBuilder toBuilder() => SharedTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SharedTrack &&
        id == other.id &&
        shareId == other.shareId &&
        trackId == other.trackId &&
        userId == other.userId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        storedTrackId == other.storedTrackId &&
        expiresAt == other.expiresAt &&
        plays == other.plays &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, shareId.hashCode);
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, storedTrackId.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, plays.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SharedTrack')
          ..add('id', id)
          ..add('shareId', shareId)
          ..add('trackId', trackId)
          ..add('userId', userId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('storedTrackId', storedTrackId)
          ..add('expiresAt', expiresAt)
          ..add('plays', plays)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class SharedTrackBuilder implements Builder<SharedTrack, SharedTrackBuilder> {
  _$SharedTrack? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _shareId;
  String? get shareId => _$this._shareId;
  set shareId(String? shareId) => _$this._shareId = shareId;

  String? _trackId;
  String? get trackId => _$this._trackId;
  set trackId(String? trackId) => _$this._trackId = trackId;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  String? _storedTrackId;
  String? get storedTrackId => _$this._storedTrackId;
  set storedTrackId(String? storedTrackId) =>
      _$this._storedTrackId = storedTrackId;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  int? _plays;
  int? get plays => _$this._plays;
  set plays(int? plays) => _$this._plays = plays;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  SharedTrackBuilder() {
    SharedTrack._defaults(this);
  }

  SharedTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _shareId = $v.shareId;
      _trackId = $v.trackId;
      _userId = $v.userId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _storedTrackId = $v.storedTrackId;
      _expiresAt = $v.expiresAt;
      _plays = $v.plays;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SharedTrack other) {
    _$v = other as _$SharedTrack;
  }

  @override
  void update(void Function(SharedTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SharedTrack build() => _build();

  _$SharedTrack _build() {
    final _$result = _$v ??
        _$SharedTrack._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'SharedTrack', 'id'),
          shareId: BuiltValueNullFieldError.checkNotNull(
              shareId, r'SharedTrack', 'shareId'),
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'SharedTrack', 'trackId'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'SharedTrack', 'userId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'SharedTrack', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'SharedTrack', 'artist'),
          album: album,
          coverUrl: coverUrl,
          duration: duration,
          storedTrackId: storedTrackId,
          expiresAt: expiresAt,
          plays: BuiltValueNullFieldError.checkNotNull(
              plays, r'SharedTrack', 'plays'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'SharedTrack', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
