// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_import_report_not_found_inner.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyImportReportNotFoundInner
    extends SpotifyImportReportNotFoundInner {
  @override
  final String spotifyId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String album;
  @override
  final String reason;

  factory _$SpotifyImportReportNotFoundInner(
          [void Function(SpotifyImportReportNotFoundInnerBuilder)? updates]) =>
      (SpotifyImportReportNotFoundInnerBuilder()..update(updates))._build();

  _$SpotifyImportReportNotFoundInner._(
      {required this.spotifyId,
      required this.title,
      required this.artist,
      required this.album,
      required this.reason})
      : super._();
  @override
  SpotifyImportReportNotFoundInner rebuild(
          void Function(SpotifyImportReportNotFoundInnerBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyImportReportNotFoundInnerBuilder toBuilder() =>
      SpotifyImportReportNotFoundInnerBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyImportReportNotFoundInner &&
        spotifyId == other.spotifyId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, spotifyId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyImportReportNotFoundInner')
          ..add('spotifyId', spotifyId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('reason', reason))
        .toString();
  }
}

class SpotifyImportReportNotFoundInnerBuilder
    implements
        Builder<SpotifyImportReportNotFoundInner,
            SpotifyImportReportNotFoundInnerBuilder> {
  _$SpotifyImportReportNotFoundInner? _$v;

  String? _spotifyId;
  String? get spotifyId => _$this._spotifyId;
  set spotifyId(String? spotifyId) => _$this._spotifyId = spotifyId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  SpotifyImportReportNotFoundInnerBuilder() {
    SpotifyImportReportNotFoundInner._defaults(this);
  }

  SpotifyImportReportNotFoundInnerBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _spotifyId = $v.spotifyId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyImportReportNotFoundInner other) {
    _$v = other as _$SpotifyImportReportNotFoundInner;
  }

  @override
  void update(void Function(SpotifyImportReportNotFoundInnerBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyImportReportNotFoundInner build() => _build();

  _$SpotifyImportReportNotFoundInner _build() {
    final _$result = _$v ??
        _$SpotifyImportReportNotFoundInner._(
          spotifyId: BuiltValueNullFieldError.checkNotNull(
              spotifyId, r'SpotifyImportReportNotFoundInner', 'spotifyId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'SpotifyImportReportNotFoundInner', 'title'),
          artist: BuiltValueNullFieldError.checkNotNull(
              artist, r'SpotifyImportReportNotFoundInner', 'artist'),
          album: BuiltValueNullFieldError.checkNotNull(
              album, r'SpotifyImportReportNotFoundInner', 'album'),
          reason: BuiltValueNullFieldError.checkNotNull(
              reason, r'SpotifyImportReportNotFoundInner', 'reason'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
