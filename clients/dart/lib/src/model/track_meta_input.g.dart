// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'track_meta_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TrackMetaInput extends TrackMetaInput {
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

  factory _$TrackMetaInput([void Function(TrackMetaInputBuilder)? updates]) =>
      (TrackMetaInputBuilder()..update(updates))._build();

  _$TrackMetaInput._(
      {required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration})
      : super._();
  @override
  TrackMetaInput rebuild(void Function(TrackMetaInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TrackMetaInputBuilder toBuilder() => TrackMetaInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TrackMetaInput &&
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
    return (newBuiltValueToStringHelper(r'TrackMetaInput')
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

class TrackMetaInputBuilder
    implements Builder<TrackMetaInput, TrackMetaInputBuilder> {
  _$TrackMetaInput? _$v;

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

  TrackMetaInputBuilder() {
    TrackMetaInput._defaults(this);
  }

  TrackMetaInputBuilder get _$this {
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
  void replace(TrackMetaInput other) {
    _$v = other as _$TrackMetaInput;
  }

  @override
  void update(void Function(TrackMetaInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TrackMetaInput build() => _build();

  _$TrackMetaInput _build() {
    final _$result = _$v ??
        _$TrackMetaInput._(
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'TrackMetaInput', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'TrackMetaInput', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'TrackMetaInput', 'artist'),
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
