// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'read_spotify_playlist_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReadSpotifyPlaylistRequest extends ReadSpotifyPlaylistRequest {
  @override
  final String url;

  factory _$ReadSpotifyPlaylistRequest(
          [void Function(ReadSpotifyPlaylistRequestBuilder)? updates]) =>
      (ReadSpotifyPlaylistRequestBuilder()..update(updates))._build();

  _$ReadSpotifyPlaylistRequest._({required this.url}) : super._();
  @override
  ReadSpotifyPlaylistRequest rebuild(
          void Function(ReadSpotifyPlaylistRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReadSpotifyPlaylistRequestBuilder toBuilder() =>
      ReadSpotifyPlaylistRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReadSpotifyPlaylistRequest && url == other.url;
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
    return (newBuiltValueToStringHelper(r'ReadSpotifyPlaylistRequest')
          ..add('url', url))
        .toString();
  }
}

class ReadSpotifyPlaylistRequestBuilder
    implements
        Builder<ReadSpotifyPlaylistRequest, ReadSpotifyPlaylistRequestBuilder> {
  _$ReadSpotifyPlaylistRequest? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  ReadSpotifyPlaylistRequestBuilder() {
    ReadSpotifyPlaylistRequest._defaults(this);
  }

  ReadSpotifyPlaylistRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReadSpotifyPlaylistRequest other) {
    _$v = other as _$ReadSpotifyPlaylistRequest;
  }

  @override
  void update(void Function(ReadSpotifyPlaylistRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReadSpotifyPlaylistRequest build() => _build();

  _$ReadSpotifyPlaylistRequest _build() {
    final _$result = _$v ??
        _$ReadSpotifyPlaylistRequest._(
          url: BuiltValueNullFieldError.checkNotNull(
              url, r'ReadSpotifyPlaylistRequest', 'url'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
