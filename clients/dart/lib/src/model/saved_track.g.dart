// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedTrack extends SavedTrack {
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
  final DateTime savedAt;

  factory _$SavedTrack([void Function(SavedTrackBuilder)? updates]) =>
      (SavedTrackBuilder()..update(updates))._build();

  _$SavedTrack._(
      {required this.id,
      required this.userId,
      required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration,
      required this.savedAt})
      : super._();
  @override
  SavedTrack rebuild(void Function(SavedTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedTrackBuilder toBuilder() => SavedTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedTrack &&
        id == other.id &&
        userId == other.userId &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        albumId == other.albumId &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        savedAt == other.savedAt;
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
    _$hash = $jc(_$hash, savedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SavedTrack')
          ..add('id', id)
          ..add('userId', userId)
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('savedAt', savedAt))
        .toString();
  }
}

class SavedTrackBuilder implements Builder<SavedTrack, SavedTrackBuilder> {
  _$SavedTrack? _$v;

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

  DateTime? _savedAt;
  DateTime? get savedAt => _$this._savedAt;
  set savedAt(DateTime? savedAt) => _$this._savedAt = savedAt;

  SavedTrackBuilder() {
    SavedTrack._defaults(this);
  }

  SavedTrackBuilder get _$this {
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
      _savedAt = $v.savedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedTrack other) {
    _$v = other as _$SavedTrack;
  }

  @override
  void update(void Function(SavedTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedTrack build() => _build();

  _$SavedTrack _build() {
    final _$result = _$v ??
        _$SavedTrack._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'SavedTrack', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'SavedTrack', 'userId'),
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'SavedTrack', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'SavedTrack', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'SavedTrack', 'artist'),
          album: album,
          albumId: albumId,
          coverUrl: coverUrl,
          duration: duration,
          savedAt: BuiltValueNullFieldError.checkNotNull(
              savedAt, r'SavedTrack', 'savedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
