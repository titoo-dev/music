// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_deezer_email_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginDeezerEmailRequest extends LoginDeezerEmailRequest {
  @override
  final String email;
  @override
  final String password;

  factory _$LoginDeezerEmailRequest(
          [void Function(LoginDeezerEmailRequestBuilder)? updates]) =>
      (LoginDeezerEmailRequestBuilder()..update(updates))._build();

  _$LoginDeezerEmailRequest._({required this.email, required this.password})
      : super._();
  @override
  LoginDeezerEmailRequest rebuild(
          void Function(LoginDeezerEmailRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginDeezerEmailRequestBuilder toBuilder() =>
      LoginDeezerEmailRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginDeezerEmailRequest &&
        email == other.email &&
        password == other.password;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginDeezerEmailRequest')
          ..add('email', email)
          ..add('password', password))
        .toString();
  }
}

class LoginDeezerEmailRequestBuilder
    implements
        Builder<LoginDeezerEmailRequest, LoginDeezerEmailRequestBuilder> {
  _$LoginDeezerEmailRequest? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  LoginDeezerEmailRequestBuilder() {
    LoginDeezerEmailRequest._defaults(this);
  }

  LoginDeezerEmailRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _password = $v.password;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginDeezerEmailRequest other) {
    _$v = other as _$LoginDeezerEmailRequest;
  }

  @override
  void update(void Function(LoginDeezerEmailRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginDeezerEmailRequest build() => _build();

  _$LoginDeezerEmailRequest _build() {
    final _$result = _$v ??
        _$LoginDeezerEmailRequest._(
          email: BuiltValueNullFieldError.checkNotNull(
              email, r'LoginDeezerEmailRequest', 'email'),
          password: BuiltValueNullFieldError.checkNotNull(
              password, r'LoginDeezerEmailRequest', 'password'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
