// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deleted_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeletedEnvelope extends DeletedEnvelope {
  @override
  final bool success;
  @override
  final DeletedEnvelopeData data;

  factory _$DeletedEnvelope([void Function(DeletedEnvelopeBuilder)? updates]) =>
      (DeletedEnvelopeBuilder()..update(updates))._build();

  _$DeletedEnvelope._({required this.success, required this.data}) : super._();
  @override
  DeletedEnvelope rebuild(void Function(DeletedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeletedEnvelopeBuilder toBuilder() => DeletedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeletedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeletedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeletedEnvelopeBuilder
    implements Builder<DeletedEnvelope, DeletedEnvelopeBuilder> {
  _$DeletedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  DeletedEnvelopeDataBuilder? _data;
  DeletedEnvelopeDataBuilder get data =>
      _$this._data ??= DeletedEnvelopeDataBuilder();
  set data(DeletedEnvelopeDataBuilder? data) => _$this._data = data;

  DeletedEnvelopeBuilder() {
    DeletedEnvelope._defaults(this);
  }

  DeletedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeletedEnvelope other) {
    _$v = other as _$DeletedEnvelope;
  }

  @override
  void update(void Function(DeletedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeletedEnvelope build() => _build();

  _$DeletedEnvelope _build() {
    _$DeletedEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeletedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeletedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeletedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
