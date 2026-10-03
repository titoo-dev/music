// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_with_tracks_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumWithTracksEnvelope extends AlbumWithTracksEnvelope {
  @override
  final bool success;
  @override
  final AlbumWithTracks data;

  factory _$AlbumWithTracksEnvelope(
          [void Function(AlbumWithTracksEnvelopeBuilder)? updates]) =>
      (AlbumWithTracksEnvelopeBuilder()..update(updates))._build();

  _$AlbumWithTracksEnvelope._({required this.success, required this.data})
      : super._();
  @override
  AlbumWithTracksEnvelope rebuild(
          void Function(AlbumWithTracksEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumWithTracksEnvelopeBuilder toBuilder() =>
      AlbumWithTracksEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumWithTracksEnvelope &&
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
    return (newBuiltValueToStringHelper(r'AlbumWithTracksEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class AlbumWithTracksEnvelopeBuilder
    implements
        Builder<AlbumWithTracksEnvelope, AlbumWithTracksEnvelopeBuilder> {
  _$AlbumWithTracksEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  AlbumWithTracksBuilder? _data;
  AlbumWithTracksBuilder get data => _$this._data ??= AlbumWithTracksBuilder();
  set data(AlbumWithTracksBuilder? data) => _$this._data = data;

  AlbumWithTracksEnvelopeBuilder() {
    AlbumWithTracksEnvelope._defaults(this);
  }

  AlbumWithTracksEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AlbumWithTracksEnvelope other) {
    _$v = other as _$AlbumWithTracksEnvelope;
  }

  @override
  void update(void Function(AlbumWithTracksEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumWithTracksEnvelope build() => _build();

  _$AlbumWithTracksEnvelope _build() {
    _$AlbumWithTracksEnvelope _$result;
    try {
      _$result = _$v ??
          _$AlbumWithTracksEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'AlbumWithTracksEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AlbumWithTracksEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
