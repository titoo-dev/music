// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'change_account_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ChangeAccountEnvelope extends ChangeAccountEnvelope {
  @override
  final bool success;
  @override
  final ChangeAccountResult data;

  factory _$ChangeAccountEnvelope(
          [void Function(ChangeAccountEnvelopeBuilder)? updates]) =>
      (ChangeAccountEnvelopeBuilder()..update(updates))._build();

  _$ChangeAccountEnvelope._({required this.success, required this.data})
      : super._();
  @override
  ChangeAccountEnvelope rebuild(
          void Function(ChangeAccountEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ChangeAccountEnvelopeBuilder toBuilder() =>
      ChangeAccountEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ChangeAccountEnvelope &&
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
    return (newBuiltValueToStringHelper(r'ChangeAccountEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class ChangeAccountEnvelopeBuilder
    implements Builder<ChangeAccountEnvelope, ChangeAccountEnvelopeBuilder> {
  _$ChangeAccountEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ChangeAccountResultBuilder? _data;
  ChangeAccountResultBuilder get data =>
      _$this._data ??= ChangeAccountResultBuilder();
  set data(ChangeAccountResultBuilder? data) => _$this._data = data;

  ChangeAccountEnvelopeBuilder() {
    ChangeAccountEnvelope._defaults(this);
  }

  ChangeAccountEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ChangeAccountEnvelope other) {
    _$v = other as _$ChangeAccountEnvelope;
  }

  @override
  void update(void Function(ChangeAccountEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ChangeAccountEnvelope build() => _build();

  _$ChangeAccountEnvelope _build() {
    _$ChangeAccountEnvelope _$result;
    try {
      _$result = _$v ??
          _$ChangeAccountEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'ChangeAccountEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ChangeAccountEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
