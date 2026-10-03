// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'logged_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoggedEnvelope extends LoggedEnvelope {
  @override
  final bool success;
  @override
  final LoggedEnvelopeData data;

  factory _$LoggedEnvelope([void Function(LoggedEnvelopeBuilder)? updates]) =>
      (LoggedEnvelopeBuilder()..update(updates))._build();

  _$LoggedEnvelope._({required this.success, required this.data}) : super._();
  @override
  LoggedEnvelope rebuild(void Function(LoggedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoggedEnvelopeBuilder toBuilder() => LoggedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoggedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'LoggedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class LoggedEnvelopeBuilder
    implements Builder<LoggedEnvelope, LoggedEnvelopeBuilder> {
  _$LoggedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  LoggedEnvelopeDataBuilder? _data;
  LoggedEnvelopeDataBuilder get data =>
      _$this._data ??= LoggedEnvelopeDataBuilder();
  set data(LoggedEnvelopeDataBuilder? data) => _$this._data = data;

  LoggedEnvelopeBuilder() {
    LoggedEnvelope._defaults(this);
  }

  LoggedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoggedEnvelope other) {
    _$v = other as _$LoggedEnvelope;
  }

  @override
  void update(void Function(LoggedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoggedEnvelope build() => _build();

  _$LoggedEnvelope _build() {
    _$LoggedEnvelope _$result;
    try {
      _$result = _$v ??
          _$LoggedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'LoggedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LoggedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
