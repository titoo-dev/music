// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'added_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AddedEnvelope extends AddedEnvelope {
  @override
  final bool success;
  @override
  final AddedEnvelopeData data;

  factory _$AddedEnvelope([void Function(AddedEnvelopeBuilder)? updates]) =>
      (AddedEnvelopeBuilder()..update(updates))._build();

  _$AddedEnvelope._({required this.success, required this.data}) : super._();
  @override
  AddedEnvelope rebuild(void Function(AddedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AddedEnvelopeBuilder toBuilder() => AddedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AddedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'AddedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class AddedEnvelopeBuilder
    implements Builder<AddedEnvelope, AddedEnvelopeBuilder> {
  _$AddedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  AddedEnvelopeDataBuilder? _data;
  AddedEnvelopeDataBuilder get data =>
      _$this._data ??= AddedEnvelopeDataBuilder();
  set data(AddedEnvelopeDataBuilder? data) => _$this._data = data;

  AddedEnvelopeBuilder() {
    AddedEnvelope._defaults(this);
  }

  AddedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AddedEnvelope other) {
    _$v = other as _$AddedEnvelope;
  }

  @override
  void update(void Function(AddedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AddedEnvelope build() => _build();

  _$AddedEnvelope _build() {
    _$AddedEnvelope _$result;
    try {
      _$result = _$v ??
          _$AddedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'AddedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AddedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
