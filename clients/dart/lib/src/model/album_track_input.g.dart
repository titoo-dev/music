// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_track_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumTrackInput extends AlbumTrackInput {
  @override
  final String trackId;
  @override
  final String? title;
  @override
  final String? artist;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final int? trackNumber;

  factory _$AlbumTrackInput([void Function(AlbumTrackInputBuilder)? updates]) =>
      (AlbumTrackInputBuilder()..update(updates))._build();

  _$AlbumTrackInput._(
      {required this.trackId,
      this.title,
      this.artist,
      this.coverUrl,
      this.duration,
      this.trackNumber})
      : super._();
  @override
  AlbumTrackInput rebuild(void Function(AlbumTrackInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumTrackInputBuilder toBuilder() => AlbumTrackInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumTrackInput &&
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
    return (newBuiltValueToStringHelper(r'AlbumTrackInput')
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('trackNumber', trackNumber))
        .toString();
  }
}

class AlbumTrackInputBuilder
    implements Builder<AlbumTrackInput, AlbumTrackInputBuilder> {
  _$AlbumTrackInput? _$v;

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

  AlbumTrackInputBuilder() {
    AlbumTrackInput._defaults(this);
  }

  AlbumTrackInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(AlbumTrackInput other) {
    _$v = other as _$AlbumTrackInput;
  }

  @override
  void update(void Function(AlbumTrackInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumTrackInput build() => _build();

  _$AlbumTrackInput _build() {
    final _$result = _$v ??
        _$AlbumTrackInput._(
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'AlbumTrackInput', 'trackId'),
          title: title,
          artist: artist,
          coverUrl: coverUrl,
          duration: duration,
          trackNumber: trackNumber,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
