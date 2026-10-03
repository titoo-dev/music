// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'change_deezer_account_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ChangeDeezerAccountRequest extends ChangeDeezerAccountRequest {
  @override
  final int child;

  factory _$ChangeDeezerAccountRequest(
          [void Function(ChangeDeezerAccountRequestBuilder)? updates]) =>
      (ChangeDeezerAccountRequestBuilder()..update(updates))._build();

  _$ChangeDeezerAccountRequest._({required this.child}) : super._();
  @override
  ChangeDeezerAccountRequest rebuild(
          void Function(ChangeDeezerAccountRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ChangeDeezerAccountRequestBuilder toBuilder() =>
      ChangeDeezerAccountRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ChangeDeezerAccountRequest && child == other.child;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, child.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ChangeDeezerAccountRequest')
          ..add('child', child))
        .toString();
  }
}

class ChangeDeezerAccountRequestBuilder
    implements
        Builder<ChangeDeezerAccountRequest, ChangeDeezerAccountRequestBuilder> {
  _$ChangeDeezerAccountRequest? _$v;

  int? _child;
  int? get child => _$this._child;
  set child(int? child) => _$this._child = child;

  ChangeDeezerAccountRequestBuilder() {
    ChangeDeezerAccountRequest._defaults(this);
  }

  ChangeDeezerAccountRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _child = $v.child;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ChangeDeezerAccountRequest other) {
    _$v = other as _$ChangeDeezerAccountRequest;
  }

  @override
  void update(void Function(ChangeDeezerAccountRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ChangeDeezerAccountRequest build() => _build();

  _$ChangeDeezerAccountRequest _build() {
    final _$result = _$v ??
        _$ChangeDeezerAccountRequest._(
          child: BuiltValueNullFieldError.checkNotNull(
              child, r'ChangeDeezerAccountRequest', 'child'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
