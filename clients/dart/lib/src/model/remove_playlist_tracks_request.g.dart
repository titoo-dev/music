// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'remove_playlist_tracks_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RemovePlaylistTracksRequest extends RemovePlaylistTracksRequest {
  @override
  final BuiltList<String> trackIds;

  factory _$RemovePlaylistTracksRequest(
          [void Function(RemovePlaylistTracksRequestBuilder)? updates]) =>
      (RemovePlaylistTracksRequestBuilder()..update(updates))._build();

  _$RemovePlaylistTracksRequest._({required this.trackIds}) : super._();
  @override
  RemovePlaylistTracksRequest rebuild(
          void Function(RemovePlaylistTracksRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RemovePlaylistTracksRequestBuilder toBuilder() =>
      RemovePlaylistTracksRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RemovePlaylistTracksRequest && trackIds == other.trackIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, trackIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RemovePlaylistTracksRequest')
          ..add('trackIds', trackIds))
        .toString();
  }
}

class RemovePlaylistTracksRequestBuilder
    implements
        Builder<RemovePlaylistTracksRequest,
            RemovePlaylistTracksRequestBuilder> {
  _$RemovePlaylistTracksRequest? _$v;

  ListBuilder<String>? _trackIds;
  ListBuilder<String> get trackIds =>
      _$this._trackIds ??= ListBuilder<String>();
  set trackIds(ListBuilder<String>? trackIds) => _$this._trackIds = trackIds;

  RemovePlaylistTracksRequestBuilder() {
    RemovePlaylistTracksRequest._defaults(this);
  }

  RemovePlaylistTracksRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _trackIds = $v.trackIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RemovePlaylistTracksRequest other) {
    _$v = other as _$RemovePlaylistTracksRequest;
  }

  @override
  void update(void Function(RemovePlaylistTracksRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RemovePlaylistTracksRequest build() => _build();

  _$RemovePlaylistTracksRequest _build() {
    _$RemovePlaylistTracksRequest _$result;
    try {
      _$result = _$v ??
          _$RemovePlaylistTracksRequest._(
            trackIds: trackIds.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'trackIds';
        trackIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RemovePlaylistTracksRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
