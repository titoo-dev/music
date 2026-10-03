// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumTrack extends AlbumTrack {
  @override
  final String id;
  @override
  final String albumId;
  @override
  final String trackId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final int? trackNumber;

  factory _$AlbumTrack([void Function(AlbumTrackBuilder)? updates]) =>
      (AlbumTrackBuilder()..update(updates))._build();

  _$AlbumTrack._(
      {required this.id,
      required this.albumId,
      required this.trackId,
      required this.title,
      required this.artist,
      this.coverUrl,
      this.duration,
      this.trackNumber})
      : super._();
  @override
  AlbumTrack rebuild(void Function(AlbumTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumTrackBuilder toBuilder() => AlbumTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumTrack &&
        id == other.id &&
        albumId == other.albumId &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        trackNumber == other.trackNumber;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, trackNumber.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AlbumTrack')
          ..add('id', id)
          ..add('albumId', albumId)
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('trackNumber', trackNumber))
        .toString();
  }
}

class AlbumTrackBuilder implements Builder<AlbumTrack, AlbumTrackBuilder> {
  _$AlbumTrack? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _albumId;
  String? get albumId => _$this._albumId;
  set albumId(String? albumId) => _$this._albumId = albumId;

  String? _trackId;
  String? get trackId => _$this._trackId;
  set trackId(String? trackId) => _$this._trackId = trackId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  int? _trackNumber;
  int? get trackNumber => _$this._trackNumber;
  set trackNumber(int? trackNumber) => _$this._trackNumber = trackNumber;

  AlbumTrackBuilder() {
    AlbumTrack._defaults(this);
  }

  AlbumTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _albumId = $v.albumId;
      _trackId = $v.trackId;
      _title = $v.title;
      _artist = $v.artist;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _trackNumber = $v.trackNumber;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AlbumTrack other) {
    _$v = other as _$AlbumTrack;
  }

  @override
  void update(void Function(AlbumTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumTrack build() => _build();

  _$AlbumTrack _build() {
    final _$result = _$v ??
        _$AlbumTrack._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'AlbumTrack', 'id'),
          albumId: BuiltValueNullFieldError.checkNotNull(
              albumId, r'AlbumTrack', 'albumId'),
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'AlbumTrack', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'AlbumTrack', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'AlbumTrack', 'artist'),
          coverUrl: coverUrl,
          duration: duration,
          trackNumber: trackNumber,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
