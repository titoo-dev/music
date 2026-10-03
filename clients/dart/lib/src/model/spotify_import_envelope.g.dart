// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_import_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyImportEnvelope extends SpotifyImportEnvelope {
  @override
  final bool success;
  @override
  final SpotifyImportResult data;

  factory _$SpotifyImportEnvelope(
          [void Function(SpotifyImportEnvelopeBuilder)? updates]) =>
      (SpotifyImportEnvelopeBuilder()..update(updates))._build();

  _$SpotifyImportEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SpotifyImportEnvelope rebuild(
          void Function(SpotifyImportEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyImportEnvelopeBuilder toBuilder() =>
      SpotifyImportEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyImportEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SpotifyImportEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SpotifyImportEnvelopeBuilder
    implements Builder<SpotifyImportEnvelope, SpotifyImportEnvelopeBuilder> {
  _$SpotifyImportEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SpotifyImportResultBuilder? _data;
  SpotifyImportResultBuilder get data =>
      _$this._data ??= SpotifyImportResultBuilder();
  set data(SpotifyImportResultBuilder? data) => _$this._data = data;

  SpotifyImportEnvelopeBuilder() {
    SpotifyImportEnvelope._defaults(this);
  }

  SpotifyImportEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyImportEnvelope other) {
    _$v = other as _$SpotifyImportEnvelope;
  }

  @override
  void update(void Function(SpotifyImportEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyImportEnvelope build() => _build();

  _$SpotifyImportEnvelope _build() {
    _$SpotifyImportEnvelope _$result;
    try {
      _$result = _$v ??
          _$SpotifyImportEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SpotifyImportEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyImportEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
