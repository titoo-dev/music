// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gc_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GcEnvelope extends GcEnvelope {
  @override
  final bool success;
  @override
  final GcResult data;

  factory _$GcEnvelope([void Function(GcEnvelopeBuilder)? updates]) =>
      (GcEnvelopeBuilder()..update(updates))._build();

  _$GcEnvelope._({required this.success, required this.data}) : super._();
  @override
  GcEnvelope rebuild(void Function(GcEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GcEnvelopeBuilder toBuilder() => GcEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GcEnvelope &&
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
    return (newBuiltValueToStringHelper(r'GcEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class GcEnvelopeBuilder implements Builder<GcEnvelope, GcEnvelopeBuilder> {
  _$GcEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  GcResultBuilder? _data;
  GcResultBuilder get data => _$this._data ??= GcResultBuilder();
  set data(GcResultBuilder? data) => _$this._data = data;

  GcEnvelopeBuilder() {
    GcEnvelope._defaults(this);
  }

  GcEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GcEnvelope other) {
    _$v = other as _$GcEnvelope;
  }

  @override
  void update(void Function(GcEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GcEnvelope build() => _build();

  _$GcEnvelope _build() {
    _$GcEnvelope _$result;
    try {
      _$result = _$v ??
          _$GcEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'GcEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'GcEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
