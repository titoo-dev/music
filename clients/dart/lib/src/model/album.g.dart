// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class AlbumBuilder {
  void replace(Album other);
  void update(void Function(AlbumBuilder) updates);
  String? get id;
  set id(String? id);

  String? get userId;
  set userId(String? userId);

  String? get deezerAlbumId;
  set deezerAlbumId(String? deezerAlbumId);

  String? get title;
  set title(String? title);

  String? get artist;
  set artist(String? artist);

  String? get coverUrl;
  set coverUrl(String? coverUrl);

  int? get trackCount;
  set trackCount(int? trackCount);

  DateTime? get savedAt;
  set savedAt(DateTime? savedAt);
}

class _$$Album extends $Album {
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

  factory _$$Album([void Function($AlbumBuilder)? updates]) =>
      ($AlbumBuilder()..update(updates))._build();

  _$$Album._(
      {required this.id,
      required this.userId,
      required this.deezerAlbumId,
      required this.title,
      required this.artist,
      this.coverUrl,
      required this.trackCount,
      required this.savedAt})
      : super._();
  @override
  $Album rebuild(void Function($AlbumBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $AlbumBuilder toBuilder() => $AlbumBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $Album &&
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
    return (newBuiltValueToStringHelper(r'$Album')
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

class $AlbumBuilder implements Builder<$Album, $AlbumBuilder>, AlbumBuilder {
  _$$Album? _$v;

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

  $AlbumBuilder() {
    $Album._defaults(this);
  }

  $AlbumBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(covariant $Album other) {
    _$v = other as _$$Album;
  }

  @override
  void update(void Function($AlbumBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $Album build() => _build();

  _$$Album _build() {
    final _$result = _$v ??
        _$$Album._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'$Album', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'$Album', 'userId'),
          deezerAlbumId: BuiltValueNullFieldError.checkNotNull(
              deezerAlbumId, r'$Album', 'deezerAlbumId'),
          title:
              BuiltValueNullFieldError.checkNotNull(title, r'$Album', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'$Album', 'artist'),
          coverUrl: coverUrl,
          trackCount: BuiltValueNullFieldError.checkNotNull(
              trackCount, r'$Album', 'trackCount'),
          savedAt: BuiltValueNullFieldError.checkNotNull(
              savedAt, r'$Album', 'savedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
