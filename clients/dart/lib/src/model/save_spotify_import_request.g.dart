// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'save_spotify_import_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SaveSpotifyImportRequest extends SaveSpotifyImportRequest {
  @override
  final String? title;
  @override
  final String? description;
  @override
  final String? coverUrl;
  @override
  final BuiltList<ImportedTrack> tracks;

  factory _$SaveSpotifyImportRequest(
          [void Function(SaveSpotifyImportRequestBuilder)? updates]) =>
      (SaveSpotifyImportRequestBuilder()..update(updates))._build();

  _$SaveSpotifyImportRequest._(
      {this.title, this.description, this.coverUrl, required this.tracks})
      : super._();
  @override
  SaveSpotifyImportRequest rebuild(
          void Function(SaveSpotifyImportRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SaveSpotifyImportRequestBuilder toBuilder() =>
      SaveSpotifyImportRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SaveSpotifyImportRequest &&
        title == other.title &&
        description == other.description &&
        coverUrl == other.coverUrl &&
        tracks == other.tracks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SaveSpotifyImportRequest')
          ..add('title', title)
          ..add('description', description)
          ..add('coverUrl', coverUrl)
          ..add('tracks', tracks))
        .toString();
  }
}

class SaveSpotifyImportRequestBuilder
    implements
        Builder<SaveSpotifyImportRequest, SaveSpotifyImportRequestBuilder> {
  _$SaveSpotifyImportRequest? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  ListBuilder<ImportedTrack>? _tracks;
  ListBuilder<ImportedTrack> get tracks =>
      _$this._tracks ??= ListBuilder<ImportedTrack>();
  set tracks(ListBuilder<ImportedTrack>? tracks) => _$this._tracks = tracks;

  SaveSpotifyImportRequestBuilder() {
    SaveSpotifyImportRequest._defaults(this);
  }

  SaveSpotifyImportRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _coverUrl = $v.coverUrl;
      _tracks = $v.tracks.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SaveSpotifyImportRequest other) {
    _$v = other as _$SaveSpotifyImportRequest;
  }

  @override
  void update(void Function(SaveSpotifyImportRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SaveSpotifyImportRequest build() => _build();

  _$SaveSpotifyImportRequest _build() {
    _$SaveSpotifyImportRequest _$result;
    try {
      _$result = _$v ??
          _$SaveSpotifyImportRequest._(
            title: title,
            description: description,
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
            r'SaveSpotifyImportRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
