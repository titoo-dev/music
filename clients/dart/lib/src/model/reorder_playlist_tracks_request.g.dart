// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reorder_playlist_tracks_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReorderPlaylistTracksRequest extends ReorderPlaylistTracksRequest {
  @override
  final BuiltList<String> trackIds;

  factory _$ReorderPlaylistTracksRequest(
          [void Function(ReorderPlaylistTracksRequestBuilder)? updates]) =>
      (ReorderPlaylistTracksRequestBuilder()..update(updates))._build();

  _$ReorderPlaylistTracksRequest._({required this.trackIds}) : super._();
  @override
  ReorderPlaylistTracksRequest rebuild(
          void Function(ReorderPlaylistTracksRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReorderPlaylistTracksRequestBuilder toBuilder() =>
      ReorderPlaylistTracksRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReorderPlaylistTracksRequest && trackIds == other.trackIds;
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
    return (newBuiltValueToStringHelper(r'ReorderPlaylistTracksRequest')
          ..add('trackIds', trackIds))
        .toString();
  }
}

class ReorderPlaylistTracksRequestBuilder
    implements
        Builder<ReorderPlaylistTracksRequest,
            ReorderPlaylistTracksRequestBuilder> {
  _$ReorderPlaylistTracksRequest? _$v;

  ListBuilder<String>? _trackIds;
  ListBuilder<String> get trackIds =>
      _$this._trackIds ??= ListBuilder<String>();
  set trackIds(ListBuilder<String>? trackIds) => _$this._trackIds = trackIds;

  ReorderPlaylistTracksRequestBuilder() {
    ReorderPlaylistTracksRequest._defaults(this);
  }

  ReorderPlaylistTracksRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _trackIds = $v.trackIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReorderPlaylistTracksRequest other) {
    _$v = other as _$ReorderPlaylistTracksRequest;
  }

  @override
  void update(void Function(ReorderPlaylistTracksRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReorderPlaylistTracksRequest build() => _build();

  _$ReorderPlaylistTracksRequest _build() {
    _$ReorderPlaylistTracksRequest _$result;
    try {
      _$result = _$v ??
          _$ReorderPlaylistTracksRequest._(
            trackIds: trackIds.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'trackIds';
        trackIds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReorderPlaylistTracksRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
