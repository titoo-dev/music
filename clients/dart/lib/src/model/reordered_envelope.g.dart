// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reordered_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReorderedEnvelope extends ReorderedEnvelope {
  @override
  final bool success;
  @override
  final ReorderedEnvelopeData data;

  factory _$ReorderedEnvelope(
          [void Function(ReorderedEnvelopeBuilder)? updates]) =>
      (ReorderedEnvelopeBuilder()..update(updates))._build();

  _$ReorderedEnvelope._({required this.success, required this.data})
      : super._();
  @override
  ReorderedEnvelope rebuild(void Function(ReorderedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReorderedEnvelopeBuilder toBuilder() =>
      ReorderedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReorderedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'ReorderedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class ReorderedEnvelopeBuilder
    implements Builder<ReorderedEnvelope, ReorderedEnvelopeBuilder> {
  _$ReorderedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ReorderedEnvelopeDataBuilder? _data;
  ReorderedEnvelopeDataBuilder get data =>
      _$this._data ??= ReorderedEnvelopeDataBuilder();
  set data(ReorderedEnvelopeDataBuilder? data) => _$this._data = data;

  ReorderedEnvelopeBuilder() {
    ReorderedEnvelope._defaults(this);
  }

  ReorderedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReorderedEnvelope other) {
    _$v = other as _$ReorderedEnvelope;
  }

  @override
  void update(void Function(ReorderedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReorderedEnvelope build() => _build();

  _$ReorderedEnvelope _build() {
    _$ReorderedEnvelope _$result;
    try {
      _$result = _$v ??
          _$ReorderedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'ReorderedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReorderedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
