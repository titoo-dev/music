// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'social_sign_in_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SocialSignInInputProviderEnum _$socialSignInInputProviderEnum_google =
    const SocialSignInInputProviderEnum._('google');

SocialSignInInputProviderEnum _$socialSignInInputProviderEnumValueOf(
    String name) {
  switch (name) {
    case 'google':
      return _$socialSignInInputProviderEnum_google;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SocialSignInInputProviderEnum>
    _$socialSignInInputProviderEnumValues = BuiltSet<
        SocialSignInInputProviderEnum>(const <SocialSignInInputProviderEnum>[
  _$socialSignInInputProviderEnum_google,
]);

Serializer<SocialSignInInputProviderEnum>
    _$socialSignInInputProviderEnumSerializer =
    _$SocialSignInInputProviderEnumSerializer();

class _$SocialSignInInputProviderEnumSerializer
    implements PrimitiveSerializer<SocialSignInInputProviderEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'google': 'google',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'google': 'google',
  };

  @override
  final Iterable<Type> types = const <Type>[SocialSignInInputProviderEnum];
  @override
  final String wireName = 'SocialSignInInputProviderEnum';

  @override
  Object serialize(
          Serializers serializers, SocialSignInInputProviderEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SocialSignInInputProviderEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SocialSignInInputProviderEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SocialSignInInput extends SocialSignInInput {
  @override
  final SocialSignInInputProviderEnum provider;
  @override
  final String? callbackURL;
  @override
  final bool? disableRedirect;
  @override
  final SocialSignInInputIdToken? idToken;

  factory _$SocialSignInInput(
          [void Function(SocialSignInInputBuilder)? updates]) =>
      (SocialSignInInputBuilder()..update(updates))._build();

  _$SocialSignInInput._(
      {required this.provider,
      this.callbackURL,
      this.disableRedirect,
      this.idToken})
      : super._();
  @override
  SocialSignInInput rebuild(void Function(SocialSignInInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SocialSignInInputBuilder toBuilder() =>
      SocialSignInInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SocialSignInInput &&
        provider == other.provider &&
        callbackURL == other.callbackURL &&
        disableRedirect == other.disableRedirect &&
        idToken == other.idToken;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, provider.hashCode);
    _$hash = $jc(_$hash, callbackURL.hashCode);
    _$hash = $jc(_$hash, disableRedirect.hashCode);
    _$hash = $jc(_$hash, idToken.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SocialSignInInput')
          ..add('provider', provider)
          ..add('callbackURL', callbackURL)
          ..add('disableRedirect', disableRedirect)
          ..add('idToken', idToken))
        .toString();
  }
}

class SocialSignInInputBuilder
    implements Builder<SocialSignInInput, SocialSignInInputBuilder> {
  _$SocialSignInInput? _$v;

  SocialSignInInputProviderEnum? _provider;
  SocialSignInInputProviderEnum? get provider => _$this._provider;
  set provider(SocialSignInInputProviderEnum? provider) =>
      _$this._provider = provider;

  String? _callbackURL;
  String? get callbackURL => _$this._callbackURL;
  set callbackURL(String? callbackURL) => _$this._callbackURL = callbackURL;

  bool? _disableRedirect;
  bool? get disableRedirect => _$this._disableRedirect;
  set disableRedirect(bool? disableRedirect) =>
      _$this._disableRedirect = disableRedirect;

  SocialSignInInputIdTokenBuilder? _idToken;
  SocialSignInInputIdTokenBuilder get idToken =>
      _$this._idToken ??= SocialSignInInputIdTokenBuilder();
  set idToken(SocialSignInInputIdTokenBuilder? idToken) =>
      _$this._idToken = idToken;

  SocialSignInInputBuilder() {
    SocialSignInInput._defaults(this);
  }

  SocialSignInInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _provider = $v.provider;
      _callbackURL = $v.callbackURL;
      _disableRedirect = $v.disableRedirect;
      _idToken = $v.idToken?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SocialSignInInput other) {
    _$v = other as _$SocialSignInInput;
  }

  @override
  void update(void Function(SocialSignInInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SocialSignInInput build() => _build();

  _$SocialSignInInput _build() {
    _$SocialSignInInput _$result;
    try {
      _$result = _$v ??
          _$SocialSignInInput._(
            provider: BuiltValueNullFieldError.checkNotNull(
                provider, r'SocialSignInInput', 'provider'),
            callbackURL: callbackURL,
            disableRedirect: disableRedirect,
            idToken: _idToken?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'idToken';
        _idToken?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SocialSignInInput', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
