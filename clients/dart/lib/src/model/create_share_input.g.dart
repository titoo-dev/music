// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_share_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateShareInput extends CreateShareInput {
  @override
  final String trackId;
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
  final num? expiresIn;

  factory _$CreateShareInput(
          [void Function(CreateShareInputBuilder)? updates]) =>
      (CreateShareInputBuilder()..update(updates))._build();

  _$CreateShareInput._(
      {required this.trackId,
      required this.title,
      required this.artist,
      this.album,
      this.coverUrl,
      this.duration,
      this.expiresIn})
      : super._();
  @override
  CreateShareInput rebuild(void Function(CreateShareInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateShareInputBuilder toBuilder() =>
      CreateShareInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateShareInput &&
        trackId == other.trackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        expiresIn == other.expiresIn;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, trackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, expiresIn.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateShareInput')
          ..add('trackId', trackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('expiresIn', expiresIn))
        .toString();
  }
}

class CreateShareInputBuilder
    implements Builder<CreateShareInput, CreateShareInputBuilder> {
  _$CreateShareInput? _$v;

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

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  num? _expiresIn;
  num? get expiresIn => _$this._expiresIn;
  set expiresIn(num? expiresIn) => _$this._expiresIn = expiresIn;

  CreateShareInputBuilder() {
    CreateShareInput._defaults(this);
  }

  CreateShareInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _trackId = $v.trackId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _expiresIn = $v.expiresIn;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateShareInput other) {
    _$v = other as _$CreateShareInput;
  }

  @override
  void update(void Function(CreateShareInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateShareInput build() => _build();

  _$CreateShareInput _build() {
    final _$result = _$v ??
        _$CreateShareInput._(
          trackId: BuiltValueNullFieldError.checkNotNull(
              trackId, r'CreateShareInput', 'trackId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'CreateShareInput', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'CreateShareInput', 'artist'),
          album: album,
          coverUrl: coverUrl,
          duration: duration,
          expiresIn: expiresIn,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
