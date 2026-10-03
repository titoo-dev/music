// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'connect_status_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ConnectStatusEnvelope extends ConnectStatusEnvelope {
  @override
  final bool success;
  @override
  final ConnectStatus data;

  factory _$ConnectStatusEnvelope(
          [void Function(ConnectStatusEnvelopeBuilder)? updates]) =>
      (ConnectStatusEnvelopeBuilder()..update(updates))._build();

  _$ConnectStatusEnvelope._({required this.success, required this.data})
      : super._();
  @override
  ConnectStatusEnvelope rebuild(
          void Function(ConnectStatusEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConnectStatusEnvelopeBuilder toBuilder() =>
      ConnectStatusEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConnectStatusEnvelope &&
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
    return (newBuiltValueToStringHelper(r'ConnectStatusEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class ConnectStatusEnvelopeBuilder
    implements Builder<ConnectStatusEnvelope, ConnectStatusEnvelopeBuilder> {
  _$ConnectStatusEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ConnectStatusBuilder? _data;
  ConnectStatusBuilder get data => _$this._data ??= ConnectStatusBuilder();
  set data(ConnectStatusBuilder? data) => _$this._data = data;

  ConnectStatusEnvelopeBuilder() {
    ConnectStatusEnvelope._defaults(this);
  }

  ConnectStatusEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConnectStatusEnvelope other) {
    _$v = other as _$ConnectStatusEnvelope;
  }

  @override
  void update(void Function(ConnectStatusEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ConnectStatusEnvelope build() => _build();

  _$ConnectStatusEnvelope _build() {
    _$ConnectStatusEnvelope _$result;
    try {
      _$result = _$v ??
          _$ConnectStatusEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'ConnectStatusEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ConnectStatusEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
