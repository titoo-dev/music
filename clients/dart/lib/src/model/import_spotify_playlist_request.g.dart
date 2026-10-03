// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'import_spotify_playlist_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportSpotifyPlaylistRequest extends ImportSpotifyPlaylistRequest {
  @override
  final String url;

  factory _$ImportSpotifyPlaylistRequest(
          [void Function(ImportSpotifyPlaylistRequestBuilder)? updates]) =>
      (ImportSpotifyPlaylistRequestBuilder()..update(updates))._build();

  _$ImportSpotifyPlaylistRequest._({required this.url}) : super._();
  @override
  ImportSpotifyPlaylistRequest rebuild(
          void Function(ImportSpotifyPlaylistRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportSpotifyPlaylistRequestBuilder toBuilder() =>
      ImportSpotifyPlaylistRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportSpotifyPlaylistRequest && url == other.url;
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
    return (newBuiltValueToStringHelper(r'ImportSpotifyPlaylistRequest')
          ..add('url', url))
        .toString();
  }
}

class ImportSpotifyPlaylistRequestBuilder
    implements
        Builder<ImportSpotifyPlaylistRequest,
            ImportSpotifyPlaylistRequestBuilder> {
  _$ImportSpotifyPlaylistRequest? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  ImportSpotifyPlaylistRequestBuilder() {
    ImportSpotifyPlaylistRequest._defaults(this);
  }

  ImportSpotifyPlaylistRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportSpotifyPlaylistRequest other) {
    _$v = other as _$ImportSpotifyPlaylistRequest;
  }

  @override
  void update(void Function(ImportSpotifyPlaylistRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportSpotifyPlaylistRequest build() => _build();

  _$ImportSpotifyPlaylistRequest _build() {
    final _$result = _$v ??
        _$ImportSpotifyPlaylistRequest._(
          url: BuiltValueNullFieldError.checkNotNull(
              url, r'ImportSpotifyPlaylistRequest', 'url'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
