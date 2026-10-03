// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MessageEnvelope extends MessageEnvelope {
  @override
  final bool success;
  @override
  final MessageResult data;

  factory _$MessageEnvelope([void Function(MessageEnvelopeBuilder)? updates]) =>
      (MessageEnvelopeBuilder()..update(updates))._build();

  _$MessageEnvelope._({required this.success, required this.data}) : super._();
  @override
  MessageEnvelope rebuild(void Function(MessageEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MessageEnvelopeBuilder toBuilder() => MessageEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MessageEnvelope &&
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
    return (newBuiltValueToStringHelper(r'MessageEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class MessageEnvelopeBuilder
    implements Builder<MessageEnvelope, MessageEnvelopeBuilder> {
  _$MessageEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  MessageResultBuilder? _data;
  MessageResultBuilder get data => _$this._data ??= MessageResultBuilder();
  set data(MessageResultBuilder? data) => _$this._data = data;

  MessageEnvelopeBuilder() {
    MessageEnvelope._defaults(this);
  }

  MessageEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MessageEnvelope other) {
    _$v = other as _$MessageEnvelope;
  }

  @override
  void update(void Function(MessageEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MessageEnvelope build() => _build();

  _$MessageEnvelope _build() {
    _$MessageEnvelope _$result;
    try {
      _$result = _$v ??
          _$MessageEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'MessageEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'MessageEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
