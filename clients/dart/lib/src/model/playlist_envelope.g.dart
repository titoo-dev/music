// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistEnvelope extends PlaylistEnvelope {
  @override
  final bool success;
  @override
  final Playlist data;

  factory _$PlaylistEnvelope(
          [void Function(PlaylistEnvelopeBuilder)? updates]) =>
      (PlaylistEnvelopeBuilder()..update(updates))._build();

  _$PlaylistEnvelope._({required this.success, required this.data}) : super._();
  @override
  PlaylistEnvelope rebuild(void Function(PlaylistEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistEnvelopeBuilder toBuilder() =>
      PlaylistEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistEnvelope &&
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
    return (newBuiltValueToStringHelper(r'PlaylistEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class PlaylistEnvelopeBuilder
    implements Builder<PlaylistEnvelope, PlaylistEnvelopeBuilder> {
  _$PlaylistEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  Playlist? _data;
  Playlist? get data => _$this._data;
  set data(Playlist? data) => _$this._data = data;

  PlaylistEnvelopeBuilder() {
    PlaylistEnvelope._defaults(this);
  }

  PlaylistEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PlaylistEnvelope other) {
    _$v = other as _$PlaylistEnvelope;
  }

  @override
  void update(void Function(PlaylistEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistEnvelope build() => _build();

  _$PlaylistEnvelope _build() {
    final _$result = _$v ??
        _$PlaylistEnvelope._(
          success: BuiltValueNullFieldError.checkNotNull(
              success, r'PlaylistEnvelope', 'success'),
          data: BuiltValueNullFieldError.checkNotNull(
              data, r'PlaylistEnvelope', 'data'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
