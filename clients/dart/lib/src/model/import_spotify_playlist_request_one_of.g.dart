// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'import_spotify_playlist_request_one_of.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportSpotifyPlaylistRequestOneOf
    extends ImportSpotifyPlaylistRequestOneOf {
  @override
  final String url;

  factory _$ImportSpotifyPlaylistRequestOneOf(
          [void Function(ImportSpotifyPlaylistRequestOneOfBuilder)? updates]) =>
      (ImportSpotifyPlaylistRequestOneOfBuilder()..update(updates))._build();

  _$ImportSpotifyPlaylistRequestOneOf._({required this.url}) : super._();
  @override
  ImportSpotifyPlaylistRequestOneOf rebuild(
          void Function(ImportSpotifyPlaylistRequestOneOfBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportSpotifyPlaylistRequestOneOfBuilder toBuilder() =>
      ImportSpotifyPlaylistRequestOneOfBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportSpotifyPlaylistRequestOneOf && url == other.url;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportSpotifyPlaylistRequestOneOf')
          ..add('url', url))
        .toString();
  }
}

class ImportSpotifyPlaylistRequestOneOfBuilder
    implements
        Builder<ImportSpotifyPlaylistRequestOneOf,
            ImportSpotifyPlaylistRequestOneOfBuilder> {
  _$ImportSpotifyPlaylistRequestOneOf? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  ImportSpotifyPlaylistRequestOneOfBuilder() {
    ImportSpotifyPlaylistRequestOneOf._defaults(this);
  }

  ImportSpotifyPlaylistRequestOneOfBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportSpotifyPlaylistRequestOneOf other) {
    _$v = other as _$ImportSpotifyPlaylistRequestOneOf;
  }

  @override
  void update(
      void Function(ImportSpotifyPlaylistRequestOneOfBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportSpotifyPlaylistRequestOneOf build() => _build();

  _$ImportSpotifyPlaylistRequestOneOf _build() {
    final _$result = _$v ??
        _$ImportSpotifyPlaylistRequestOneOf._(
          url: BuiltValueNullFieldError.checkNotNull(
              url, r'ImportSpotifyPlaylistRequestOneOf', 'url'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
