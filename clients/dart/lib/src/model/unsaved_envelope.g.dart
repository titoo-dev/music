// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unsaved_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UnsavedEnvelope extends UnsavedEnvelope {
  @override
  final bool success;
  @override
  final UnsavedEnvelopeData data;

  factory _$UnsavedEnvelope([void Function(UnsavedEnvelopeBuilder)? updates]) =>
      (UnsavedEnvelopeBuilder()..update(updates))._build();

  _$UnsavedEnvelope._({required this.success, required this.data}) : super._();
  @override
  UnsavedEnvelope rebuild(void Function(UnsavedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UnsavedEnvelopeBuilder toBuilder() => UnsavedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UnsavedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'UnsavedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class UnsavedEnvelopeBuilder
    implements Builder<UnsavedEnvelope, UnsavedEnvelopeBuilder> {
  _$UnsavedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  UnsavedEnvelopeDataBuilder? _data;
  UnsavedEnvelopeDataBuilder get data =>
      _$this._data ??= UnsavedEnvelopeDataBuilder();
  set data(UnsavedEnvelopeDataBuilder? data) => _$this._data = data;

  UnsavedEnvelopeBuilder() {
    UnsavedEnvelope._defaults(this);
  }

  UnsavedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UnsavedEnvelope other) {
    _$v = other as _$UnsavedEnvelope;
  }

  @override
  void update(void Function(UnsavedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UnsavedEnvelope build() => _build();

  _$UnsavedEnvelope _build() {
    _$UnsavedEnvelope _$result;
    try {
      _$result = _$v ??
          _$UnsavedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'UnsavedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UnsavedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
