// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'skip_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SkipEnvelope extends SkipEnvelope {
  @override
  final bool success;
  @override
  final SkipResult data;

  factory _$SkipEnvelope([void Function(SkipEnvelopeBuilder)? updates]) =>
      (SkipEnvelopeBuilder()..update(updates))._build();

  _$SkipEnvelope._({required this.success, required this.data}) : super._();
  @override
  SkipEnvelope rebuild(void Function(SkipEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SkipEnvelopeBuilder toBuilder() => SkipEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SkipEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SkipEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SkipEnvelopeBuilder
    implements Builder<SkipEnvelope, SkipEnvelopeBuilder> {
  _$SkipEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SkipResultBuilder? _data;
  SkipResultBuilder get data => _$this._data ??= SkipResultBuilder();
  set data(SkipResultBuilder? data) => _$this._data = data;

  SkipEnvelopeBuilder() {
    SkipEnvelope._defaults(this);
  }

  SkipEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SkipEnvelope other) {
    _$v = other as _$SkipEnvelope;
  }

  @override
  void update(void Function(SkipEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SkipEnvelope build() => _build();

  _$SkipEnvelope _build() {
    _$SkipEnvelope _$result;
    try {
      _$result = _$v ??
          _$SkipEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SkipEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SkipEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
