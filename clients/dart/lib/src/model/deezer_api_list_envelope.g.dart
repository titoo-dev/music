// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_api_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerApiListEnvelope extends DeezerApiListEnvelope {
  @override
  final bool success;
  @override
  final DeezerApiList data;

  factory _$DeezerApiListEnvelope(
          [void Function(DeezerApiListEnvelopeBuilder)? updates]) =>
      (DeezerApiListEnvelopeBuilder()..update(updates))._build();

  _$DeezerApiListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  DeezerApiListEnvelope rebuild(
          void Function(DeezerApiListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerApiListEnvelopeBuilder toBuilder() =>
      DeezerApiListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerApiListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeezerApiListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeezerApiListEnvelopeBuilder
    implements Builder<DeezerApiListEnvelope, DeezerApiListEnvelopeBuilder> {
  _$DeezerApiListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  DeezerApiListBuilder? _data;
  DeezerApiListBuilder get data => _$this._data ??= DeezerApiListBuilder();
  set data(DeezerApiListBuilder? data) => _$this._data = data;

  DeezerApiListEnvelopeBuilder() {
    DeezerApiListEnvelope._defaults(this);
  }

  DeezerApiListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerApiListEnvelope other) {
    _$v = other as _$DeezerApiListEnvelope;
  }

  @override
  void update(void Function(DeezerApiListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerApiListEnvelope build() => _build();

  _$DeezerApiListEnvelope _build() {
    _$DeezerApiListEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeezerApiListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeezerApiListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerApiListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
