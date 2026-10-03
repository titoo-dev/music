// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_deezer_arl_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoginDeezerArlRequest extends LoginDeezerArlRequest {
  @override
  final String arl;
  @override
  final int? child;

  factory _$LoginDeezerArlRequest(
          [void Function(LoginDeezerArlRequestBuilder)? updates]) =>
      (LoginDeezerArlRequestBuilder()..update(updates))._build();

  _$LoginDeezerArlRequest._({required this.arl, this.child}) : super._();
  @override
  LoginDeezerArlRequest rebuild(
          void Function(LoginDeezerArlRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginDeezerArlRequestBuilder toBuilder() =>
      LoginDeezerArlRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginDeezerArlRequest &&
        arl == other.arl &&
        child == other.child;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, arl.hashCode);
    _$hash = $jc(_$hash, child.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginDeezerArlRequest')
          ..add('arl', arl)
          ..add('child', child))
        .toString();
  }
}

class LoginDeezerArlRequestBuilder
    implements Builder<LoginDeezerArlRequest, LoginDeezerArlRequestBuilder> {
  _$LoginDeezerArlRequest? _$v;

  String? _arl;
  String? get arl => _$this._arl;
  set arl(String? arl) => _$this._arl = arl;

  int? _child;
  int? get child => _$this._child;
  set child(int? child) => _$this._child = child;

  LoginDeezerArlRequestBuilder() {
    LoginDeezerArlRequest._defaults(this);
  }

  LoginDeezerArlRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _arl = $v.arl;
      _child = $v.child;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginDeezerArlRequest other) {
    _$v = other as _$LoginDeezerArlRequest;
  }

  @override
  void update(void Function(LoginDeezerArlRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginDeezerArlRequest build() => _build();

  _$LoginDeezerArlRequest _build() {
    final _$result = _$v ??
        _$LoginDeezerArlRequest._(
          arl: BuiltValueNullFieldError.checkNotNull(
              arl, r'LoginDeezerArlRequest', 'arl'),
          child: child,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
