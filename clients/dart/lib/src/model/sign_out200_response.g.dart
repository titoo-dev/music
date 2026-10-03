// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sign_out200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SignOut200Response extends SignOut200Response {
  @override
  final bool? success;

  factory _$SignOut200Response(
          [void Function(SignOut200ResponseBuilder)? updates]) =>
      (SignOut200ResponseBuilder()..update(updates))._build();

  _$SignOut200Response._({this.success}) : super._();
  @override
  SignOut200Response rebuild(
          void Function(SignOut200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SignOut200ResponseBuilder toBuilder() =>
      SignOut200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SignOut200Response && success == other.success;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SignOut200Response')
          ..add('success', success))
        .toString();
  }
}

class SignOut200ResponseBuilder
    implements Builder<SignOut200Response, SignOut200ResponseBuilder> {
  _$SignOut200Response? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SignOut200ResponseBuilder() {
    SignOut200Response._defaults(this);
  }

  SignOut200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SignOut200Response other) {
    _$v = other as _$SignOut200Response;
  }

  @override
  void update(void Function(SignOut200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SignOut200Response build() => _build();

  _$SignOut200Response _build() {
    final _$result = _$v ??
        _$SignOut200Response._(
          success: success,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
