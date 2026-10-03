// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_share_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PublicShareEnvelope extends PublicShareEnvelope {
  @override
  final bool success;
  @override
  final PublicShare data;

  factory _$PublicShareEnvelope(
          [void Function(PublicShareEnvelopeBuilder)? updates]) =>
      (PublicShareEnvelopeBuilder()..update(updates))._build();

  _$PublicShareEnvelope._({required this.success, required this.data})
      : super._();
  @override
  PublicShareEnvelope rebuild(
          void Function(PublicShareEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PublicShareEnvelopeBuilder toBuilder() =>
      PublicShareEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PublicShareEnvelope &&
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
    return (newBuiltValueToStringHelper(r'PublicShareEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class PublicShareEnvelopeBuilder
    implements Builder<PublicShareEnvelope, PublicShareEnvelopeBuilder> {
  _$PublicShareEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  PublicShareBuilder? _data;
  PublicShareBuilder get data => _$this._data ??= PublicShareBuilder();
  set data(PublicShareBuilder? data) => _$this._data = data;

  PublicShareEnvelopeBuilder() {
    PublicShareEnvelope._defaults(this);
  }

  PublicShareEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PublicShareEnvelope other) {
    _$v = other as _$PublicShareEnvelope;
  }

  @override
  void update(void Function(PublicShareEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PublicShareEnvelope build() => _build();

  _$PublicShareEnvelope _build() {
    _$PublicShareEnvelope _$result;
    try {
      _$result = _$v ??
          _$PublicShareEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'PublicShareEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PublicShareEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
