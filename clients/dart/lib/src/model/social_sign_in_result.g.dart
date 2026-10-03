// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'social_sign_in_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SocialSignInResult extends SocialSignInResult {
  @override
  final bool? redirect;
  @override
  final String? url;
  @override
  final String? token;
  @override
  final BetterAuthUser? user;

  factory _$SocialSignInResult(
          [void Function(SocialSignInResultBuilder)? updates]) =>
      (SocialSignInResultBuilder()..update(updates))._build();

  _$SocialSignInResult._({this.redirect, this.url, this.token, this.user})
      : super._();
  @override
  SocialSignInResult rebuild(
          void Function(SocialSignInResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SocialSignInResultBuilder toBuilder() =>
      SocialSignInResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SocialSignInResult &&
        redirect == other.redirect &&
        url == other.url &&
        token == other.token &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, redirect.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SocialSignInResult')
          ..add('redirect', redirect)
          ..add('url', url)
          ..add('token', token)
          ..add('user', user))
        .toString();
  }
}

class SocialSignInResultBuilder
    implements Builder<SocialSignInResult, SocialSignInResultBuilder> {
  _$SocialSignInResult? _$v;

  bool? _redirect;
  bool? get redirect => _$this._redirect;
  set redirect(bool? redirect) => _$this._redirect = redirect;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  BetterAuthUserBuilder? _user;
  BetterAuthUserBuilder get user => _$this._user ??= BetterAuthUserBuilder();
  set user(BetterAuthUserBuilder? user) => _$this._user = user;

  SocialSignInResultBuilder() {
    SocialSignInResult._defaults(this);
  }

  SocialSignInResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _redirect = $v.redirect;
      _url = $v.url;
      _token = $v.token;
      _user = $v.user?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SocialSignInResult other) {
    _$v = other as _$SocialSignInResult;
  }

  @override
  void update(void Function(SocialSignInResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SocialSignInResult build() => _build();

  _$SocialSignInResult _build() {
    _$SocialSignInResult _$result;
    try {
      _$result = _$v ??
          _$SocialSignInResult._(
            redirect: redirect,
            url: url,
            token: token,
            user: _user?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        _user?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SocialSignInResult', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
