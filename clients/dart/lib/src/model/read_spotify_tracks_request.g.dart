// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'read_spotify_tracks_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReadSpotifyTracksRequest extends ReadSpotifyTracksRequest {
  @override
  final BuiltList<String> ids;

  factory _$ReadSpotifyTracksRequest(
          [void Function(ReadSpotifyTracksRequestBuilder)? updates]) =>
      (ReadSpotifyTracksRequestBuilder()..update(updates))._build();

  _$ReadSpotifyTracksRequest._({required this.ids}) : super._();
  @override
  ReadSpotifyTracksRequest rebuild(
          void Function(ReadSpotifyTracksRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReadSpotifyTracksRequestBuilder toBuilder() =>
      ReadSpotifyTracksRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReadSpotifyTracksRequest && ids == other.ids;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ids.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReadSpotifyTracksRequest')
          ..add('ids', ids))
        .toString();
  }
}

class ReadSpotifyTracksRequestBuilder
    implements
        Builder<ReadSpotifyTracksRequest, ReadSpotifyTracksRequestBuilder> {
  _$ReadSpotifyTracksRequest? _$v;

  ListBuilder<String>? _ids;
  ListBuilder<String> get ids => _$this._ids ??= ListBuilder<String>();
  set ids(ListBuilder<String>? ids) => _$this._ids = ids;

  ReadSpotifyTracksRequestBuilder() {
    ReadSpotifyTracksRequest._defaults(this);
  }

  ReadSpotifyTracksRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ids = $v.ids.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReadSpotifyTracksRequest other) {
    _$v = other as _$ReadSpotifyTracksRequest;
  }

  @override
  void update(void Function(ReadSpotifyTracksRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReadSpotifyTracksRequest build() => _build();

  _$ReadSpotifyTracksRequest _build() {
    _$ReadSpotifyTracksRequest _$result;
    try {
      _$result = _$v ??
          _$ReadSpotifyTracksRequest._(
            ids: ids.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'ids';
        ids.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReadSpotifyTracksRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
