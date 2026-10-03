// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'social_sign_in_input_id_token.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SocialSignInInputIdToken extends SocialSignInInputIdToken {
  @override
  final String token;
  @override
  final String? accessToken;
  @override
  final String? nonce;

  factory _$SocialSignInInputIdToken(
          [void Function(SocialSignInInputIdTokenBuilder)? updates]) =>
      (SocialSignInInputIdTokenBuilder()..update(updates))._build();

  _$SocialSignInInputIdToken._(
      {required this.token, this.accessToken, this.nonce})
      : super._();
  @override
  SocialSignInInputIdToken rebuild(
          void Function(SocialSignInInputIdTokenBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SocialSignInInputIdTokenBuilder toBuilder() =>
      SocialSignInInputIdTokenBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SocialSignInInputIdToken &&
        token == other.token &&
        accessToken == other.accessToken &&
        nonce == other.nonce;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, accessToken.hashCode);
    _$hash = $jc(_$hash, nonce.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SocialSignInInputIdToken')
          ..add('token', token)
          ..add('accessToken', accessToken)
          ..add('nonce', nonce))
        .toString();
  }
}

class SocialSignInInputIdTokenBuilder
    implements
        Builder<SocialSignInInputIdToken, SocialSignInInputIdTokenBuilder> {
  _$SocialSignInInputIdToken? _$v;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

  String? _nonce;
  String? get nonce => _$this._nonce;
  set nonce(String? nonce) => _$this._nonce = nonce;

  SocialSignInInputIdTokenBuilder() {
    SocialSignInInputIdToken._defaults(this);
  }

  SocialSignInInputIdTokenBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _token = $v.token;
      _accessToken = $v.accessToken;
      _nonce = $v.nonce;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SocialSignInInputIdToken other) {
    _$v = other as _$SocialSignInInputIdToken;
  }

  @override
  void update(void Function(SocialSignInInputIdTokenBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SocialSignInInputIdToken build() => _build();

  _$SocialSignInInputIdToken _build() {
    final _$result = _$v ??
        _$SocialSignInInputIdToken._(
          token: BuiltValueNullFieldError.checkNotNull(
              token, r'SocialSignInInputIdToken', 'token'),
          accessToken: accessToken,
          nonce: nonce,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
