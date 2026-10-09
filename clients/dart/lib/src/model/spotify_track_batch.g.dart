// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_track_batch.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyTrackBatch extends SpotifyTrackBatch {
  @override
  final BuiltList<SpotifyTrack> tracks;
  @override
  final BuiltList<String> failed;
  @override
  final BuiltList<String> rateLimited;

  factory _$SpotifyTrackBatch(
          [void Function(SpotifyTrackBatchBuilder)? updates]) =>
      (SpotifyTrackBatchBuilder()..update(updates))._build();

  _$SpotifyTrackBatch._(
      {required this.tracks, required this.failed, required this.rateLimited})
      : super._();
  @override
  SpotifyTrackBatch rebuild(void Function(SpotifyTrackBatchBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyTrackBatchBuilder toBuilder() =>
      SpotifyTrackBatchBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyTrackBatch &&
        tracks == other.tracks &&
        failed == other.failed &&
        rateLimited == other.rateLimited;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, failed.hashCode);
    _$hash = $jc(_$hash, rateLimited.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyTrackBatch')
          ..add('tracks', tracks)
          ..add('failed', failed)
          ..add('rateLimited', rateLimited))
        .toString();
  }
}

class SpotifyTrackBatchBuilder
    implements Builder<SpotifyTrackBatch, SpotifyTrackBatchBuilder> {
  _$SpotifyTrackBatch? _$v;

  ListBuilder<SpotifyTrack>? _tracks;
  ListBuilder<SpotifyTrack> get tracks =>
      _$this._tracks ??= ListBuilder<SpotifyTrack>();
  set tracks(ListBuilder<SpotifyTrack>? tracks) => _$this._tracks = tracks;

  ListBuilder<String>? _failed;
  ListBuilder<String> get failed => _$this._failed ??= ListBuilder<String>();
  set failed(ListBuilder<String>? failed) => _$this._failed = failed;

  ListBuilder<String>? _rateLimited;
  ListBuilder<String> get rateLimited =>
      _$this._rateLimited ??= ListBuilder<String>();
  set rateLimited(ListBuilder<String>? rateLimited) =>
      _$this._rateLimited = rateLimited;

  SpotifyTrackBatchBuilder() {
    SpotifyTrackBatch._defaults(this);
  }

  SpotifyTrackBatchBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _failed = $v.failed.toBuilder();
      _rateLimited = $v.rateLimited.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyTrackBatch other) {
    _$v = other as _$SpotifyTrackBatch;
  }

  @override
  void update(void Function(SpotifyTrackBatchBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyTrackBatch build() => _build();

  _$SpotifyTrackBatch _build() {
    _$SpotifyTrackBatch _$result;
    try {
      _$result = _$v ??
          _$SpotifyTrackBatch._(
            tracks: tracks.build(),
            failed: failed.build(),
            rateLimited: rateLimited.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
        _$failedField = 'failed';
        failed.build();
        _$failedField = 'rateLimited';
        rateLimited.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyTrackBatch', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
