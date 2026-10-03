// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumListEnvelope extends AlbumListEnvelope {
  @override
  final bool success;
  @override
  final AlbumListEnvelopeData data;

  factory _$AlbumListEnvelope(
          [void Function(AlbumListEnvelopeBuilder)? updates]) =>
      (AlbumListEnvelopeBuilder()..update(updates))._build();

  _$AlbumListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  AlbumListEnvelope rebuild(void Function(AlbumListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumListEnvelopeBuilder toBuilder() =>
      AlbumListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'AlbumListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class AlbumListEnvelopeBuilder
    implements Builder<AlbumListEnvelope, AlbumListEnvelopeBuilder> {
  _$AlbumListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  AlbumListEnvelopeDataBuilder? _data;
  AlbumListEnvelopeDataBuilder get data =>
      _$this._data ??= AlbumListEnvelopeDataBuilder();
  set data(AlbumListEnvelopeDataBuilder? data) => _$this._data = data;

  AlbumListEnvelopeBuilder() {
    AlbumListEnvelope._defaults(this);
  }

  AlbumListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AlbumListEnvelope other) {
    _$v = other as _$AlbumListEnvelope;
  }

  @override
  void update(void Function(AlbumListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumListEnvelope build() => _build();

  _$AlbumListEnvelope _build() {
    _$AlbumListEnvelope _$result;
    try {
      _$result = _$v ??
          _$AlbumListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'AlbumListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AlbumListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
