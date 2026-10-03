// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'add_playlist_tracks_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AddPlaylistTracksRequest extends AddPlaylistTracksRequest {
  @override
  final BuiltList<PlaylistTrackInput> tracks;

  factory _$AddPlaylistTracksRequest(
          [void Function(AddPlaylistTracksRequestBuilder)? updates]) =>
      (AddPlaylistTracksRequestBuilder()..update(updates))._build();

  _$AddPlaylistTracksRequest._({required this.tracks}) : super._();
  @override
  AddPlaylistTracksRequest rebuild(
          void Function(AddPlaylistTracksRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AddPlaylistTracksRequestBuilder toBuilder() =>
      AddPlaylistTracksRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AddPlaylistTracksRequest && tracks == other.tracks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AddPlaylistTracksRequest')
          ..add('tracks', tracks))
        .toString();
  }
}

class AddPlaylistTracksRequestBuilder
    implements
        Builder<AddPlaylistTracksRequest, AddPlaylistTracksRequestBuilder> {
  _$AddPlaylistTracksRequest? _$v;

  ListBuilder<PlaylistTrackInput>? _tracks;
  ListBuilder<PlaylistTrackInput> get tracks =>
      _$this._tracks ??= ListBuilder<PlaylistTrackInput>();
  set tracks(ListBuilder<PlaylistTrackInput>? tracks) =>
      _$this._tracks = tracks;

  AddPlaylistTracksRequestBuilder() {
    AddPlaylistTracksRequest._defaults(this);
  }

  AddPlaylistTracksRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AddPlaylistTracksRequest other) {
    _$v = other as _$AddPlaylistTracksRequest;
  }

  @override
  void update(void Function(AddPlaylistTracksRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AddPlaylistTracksRequest build() => _build();

  _$AddPlaylistTracksRequest _build() {
    _$AddPlaylistTracksRequest _$result;
    try {
      _$result = _$v ??
          _$AddPlaylistTracksRequest._(
            tracks: tracks.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AddPlaylistTracksRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
