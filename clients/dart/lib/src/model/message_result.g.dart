// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MessageResult extends MessageResult {
  @override
  final String message;

  factory _$MessageResult([void Function(MessageResultBuilder)? updates]) =>
      (MessageResultBuilder()..update(updates))._build();

  _$MessageResult._({required this.message}) : super._();
  @override
  MessageResult rebuild(void Function(MessageResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MessageResultBuilder toBuilder() => MessageResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MessageResult && message == other.message;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MessageResult')
          ..add('message', message))
        .toString();
  }
}

class MessageResultBuilder
    implements Builder<MessageResult, MessageResultBuilder> {
  _$MessageResult? _$v;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  MessageResultBuilder() {
    MessageResult._defaults(this);
  }

  MessageResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _message = $v.message;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MessageResult other) {
    _$v = other as _$MessageResult;
  }

  @override
  void update(void Function(MessageResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MessageResult build() => _build();

  _$MessageResult _build() {
    final _$result = _$v ??
        _$MessageResult._(
          message: BuiltValueNullFieldError.checkNotNull(
              message, r'MessageResult', 'message'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
