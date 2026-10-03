// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'save_album_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SaveAlbumInput extends SaveAlbumInput {
  @override
  final String deezerAlbumId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? coverUrl;
  @override
  final BuiltList<AlbumTrackInput> tracks;

  factory _$SaveAlbumInput([void Function(SaveAlbumInputBuilder)? updates]) =>
      (SaveAlbumInputBuilder()..update(updates))._build();

  _$SaveAlbumInput._(
      {required this.deezerAlbumId,
      required this.title,
      required this.artist,
      this.coverUrl,
      required this.tracks})
      : super._();
  @override
  SaveAlbumInput rebuild(void Function(SaveAlbumInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SaveAlbumInputBuilder toBuilder() => SaveAlbumInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SaveAlbumInput &&
        deezerAlbumId == other.deezerAlbumId &&
        title == other.title &&
        artist == other.artist &&
        coverUrl == other.coverUrl &&
        tracks == other.tracks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, deezerAlbumId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SaveAlbumInput')
          ..add('deezerAlbumId', deezerAlbumId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('coverUrl', coverUrl)
          ..add('tracks', tracks))
        .toString();
  }
}

class SaveAlbumInputBuilder
    implements Builder<SaveAlbumInput, SaveAlbumInputBuilder> {
  _$SaveAlbumInput? _$v;

  String? _deezerAlbumId;
  String? get deezerAlbumId => _$this._deezerAlbumId;
  set deezerAlbumId(String? deezerAlbumId) =>
      _$this._deezerAlbumId = deezerAlbumId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  ListBuilder<AlbumTrackInput>? _tracks;
  ListBuilder<AlbumTrackInput> get tracks =>
      _$this._tracks ??= ListBuilder<AlbumTrackInput>();
  set tracks(ListBuilder<AlbumTrackInput>? tracks) => _$this._tracks = tracks;

  SaveAlbumInputBuilder() {
    SaveAlbumInput._defaults(this);
  }

  SaveAlbumInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _deezerAlbumId = $v.deezerAlbumId;
      _title = $v.title;
      _artist = $v.artist;
      _coverUrl = $v.coverUrl;
      _tracks = $v.tracks.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SaveAlbumInput other) {
    _$v = other as _$SaveAlbumInput;
  }

  @override
  void update(void Function(SaveAlbumInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SaveAlbumInput build() => _build();

  _$SaveAlbumInput _build() {
    _$SaveAlbumInput _$result;
    try {
      _$result = _$v ??
          _$SaveAlbumInput._(
            deezerAlbumId: BuiltValueNullFieldError.checkNotNull(
                deezerAlbumId, r'SaveAlbumInput', 'deezerAlbumId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'SaveAlbumInput', 'title'),
            artist: BuiltValueNullFieldError.checkNotNull(
                artist, r'SaveAlbumInput', 'artist'),
            coverUrl: coverUrl,
            tracks: tracks.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SaveAlbumInput', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
