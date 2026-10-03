// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_with_tracks_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistWithTracksEnvelope extends PlaylistWithTracksEnvelope {
  @override
  final bool success;
  @override
  final PlaylistWithTracks data;

  factory _$PlaylistWithTracksEnvelope(
          [void Function(PlaylistWithTracksEnvelopeBuilder)? updates]) =>
      (PlaylistWithTracksEnvelopeBuilder()..update(updates))._build();

  _$PlaylistWithTracksEnvelope._({required this.success, required this.data})
      : super._();
  @override
  PlaylistWithTracksEnvelope rebuild(
          void Function(PlaylistWithTracksEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistWithTracksEnvelopeBuilder toBuilder() =>
      PlaylistWithTracksEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistWithTracksEnvelope &&
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
    return (newBuiltValueToStringHelper(r'PlaylistWithTracksEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class PlaylistWithTracksEnvelopeBuilder
    implements
        Builder<PlaylistWithTracksEnvelope, PlaylistWithTracksEnvelopeBuilder> {
  _$PlaylistWithTracksEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  PlaylistWithTracksBuilder? _data;
  PlaylistWithTracksBuilder get data =>
      _$this._data ??= PlaylistWithTracksBuilder();
  set data(PlaylistWithTracksBuilder? data) => _$this._data = data;

  PlaylistWithTracksEnvelopeBuilder() {
    PlaylistWithTracksEnvelope._defaults(this);
  }

  PlaylistWithTracksEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PlaylistWithTracksEnvelope other) {
    _$v = other as _$PlaylistWithTracksEnvelope;
  }

  @override
  void update(void Function(PlaylistWithTracksEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistWithTracksEnvelope build() => _build();

  _$PlaylistWithTracksEnvelope _build() {
    _$PlaylistWithTracksEnvelope _$result;
    try {
      _$result = _$v ??
          _$PlaylistWithTracksEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'PlaylistWithTracksEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PlaylistWithTracksEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
