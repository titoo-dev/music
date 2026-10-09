// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_playlist_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyPlaylistEnvelope extends SpotifyPlaylistEnvelope {
  @override
  final bool success;
  @override
  final SpotifyPlaylist data;

  factory _$SpotifyPlaylistEnvelope(
          [void Function(SpotifyPlaylistEnvelopeBuilder)? updates]) =>
      (SpotifyPlaylistEnvelopeBuilder()..update(updates))._build();

  _$SpotifyPlaylistEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SpotifyPlaylistEnvelope rebuild(
          void Function(SpotifyPlaylistEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyPlaylistEnvelopeBuilder toBuilder() =>
      SpotifyPlaylistEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyPlaylistEnvelope &&
        success == other.success &&
        data == other.data;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyPlaylistEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SpotifyPlaylistEnvelopeBuilder
    implements
        Builder<SpotifyPlaylistEnvelope, SpotifyPlaylistEnvelopeBuilder> {
  _$SpotifyPlaylistEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SpotifyPlaylistBuilder? _data;
  SpotifyPlaylistBuilder get data => _$this._data ??= SpotifyPlaylistBuilder();
  set data(SpotifyPlaylistBuilder? data) => _$this._data = data;

  SpotifyPlaylistEnvelopeBuilder() {
    SpotifyPlaylistEnvelope._defaults(this);
  }

  SpotifyPlaylistEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyPlaylistEnvelope other) {
    _$v = other as _$SpotifyPlaylistEnvelope;
  }

  @override
  void update(void Function(SpotifyPlaylistEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyPlaylistEnvelope build() => _build();

  _$SpotifyPlaylistEnvelope _build() {
    _$SpotifyPlaylistEnvelope _$result;
    try {
      _$result = _$v ??
          _$SpotifyPlaylistEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SpotifyPlaylistEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyPlaylistEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
