// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'removed_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RemovedEnvelope extends RemovedEnvelope {
  @override
  final bool success;
  @override
  final RemovedEnvelopeData data;

  factory _$RemovedEnvelope([void Function(RemovedEnvelopeBuilder)? updates]) =>
      (RemovedEnvelopeBuilder()..update(updates))._build();

  _$RemovedEnvelope._({required this.success, required this.data}) : super._();
  @override
  RemovedEnvelope rebuild(void Function(RemovedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RemovedEnvelopeBuilder toBuilder() => RemovedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RemovedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'RemovedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class RemovedEnvelopeBuilder
    implements Builder<RemovedEnvelope, RemovedEnvelopeBuilder> {
  _$RemovedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  RemovedEnvelopeDataBuilder? _data;
  RemovedEnvelopeDataBuilder get data =>
      _$this._data ??= RemovedEnvelopeDataBuilder();
  set data(RemovedEnvelopeDataBuilder? data) => _$this._data = data;

  RemovedEnvelopeBuilder() {
    RemovedEnvelope._defaults(this);
  }

  RemovedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RemovedEnvelope other) {
    _$v = other as _$RemovedEnvelope;
  }

  @override
  void update(void Function(RemovedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RemovedEnvelope build() => _build();

  _$RemovedEnvelope _build() {
    _$RemovedEnvelope _$result;
    try {
      _$result = _$v ??
          _$RemovedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'RemovedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RemovedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
