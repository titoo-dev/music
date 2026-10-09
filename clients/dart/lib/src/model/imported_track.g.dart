// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'imported_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportedTrack extends ImportedTrack {
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

  factory _$ImportedTrack([void Function(ImportedTrackBuilder)? updates]) =>
      (ImportedTrackBuilder()..update(updates))._build();

  _$ImportedTrack._(
      {required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration})
      : super._();
  @override
  ImportedTrack rebuild(void Function(ImportedTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportedTrackBuilder toBuilder() => ImportedTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportedTrack &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        albumId == other.albumId &&
        coverUrl == other.coverUrl &&
        duration == other.duration;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportedTrack')
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration))
        .toString();
  }
}

class ImportedTrackBuilder
    implements Builder<ImportedTrack, ImportedTrackBuilder> {
  _$ImportedTrack? _$v;

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

  ImportedTrackBuilder() {
    ImportedTrack._defaults(this);
  }

  ImportedTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _trackId = $v.trackId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _albumId = $v.albumId;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportedTrack other) {
    _$v = other as _$ImportedTrack;
  }

  @override
  void update(void Function(ImportedTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportedTrack build() => _build();

  _$ImportedTrack _build() {
    final _$result = _$v ??
        _$ImportedTrack._(
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'ImportedTrack', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'ImportedTrack', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'ImportedTrack', 'artist'),
          album: album,
          albumId: albumId,
          coverUrl: coverUrl,
          duration: duration,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
