// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'connect_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ConnectStatusDeezerAvailableEnum _$connectStatusDeezerAvailableEnum_yes =
    const ConnectStatusDeezerAvailableEnum._('yes');
const ConnectStatusDeezerAvailableEnum _$connectStatusDeezerAvailableEnum_no =
    const ConnectStatusDeezerAvailableEnum._('no');
const ConnectStatusDeezerAvailableEnum
    _$connectStatusDeezerAvailableEnum_noNetwork =
    const ConnectStatusDeezerAvailableEnum._('noNetwork');

ConnectStatusDeezerAvailableEnum _$connectStatusDeezerAvailableEnumValueOf(
    String name) {
  switch (name) {
    case 'yes':
      return _$connectStatusDeezerAvailableEnum_yes;
    case 'no':
      return _$connectStatusDeezerAvailableEnum_no;
    case 'noNetwork':
      return _$connectStatusDeezerAvailableEnum_noNetwork;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ConnectStatusDeezerAvailableEnum>
    _$connectStatusDeezerAvailableEnumValues = BuiltSet<
        ConnectStatusDeezerAvailableEnum>(const <ConnectStatusDeezerAvailableEnum>[
  _$connectStatusDeezerAvailableEnum_yes,
  _$connectStatusDeezerAvailableEnum_no,
  _$connectStatusDeezerAvailableEnum_noNetwork,
]);

Serializer<ConnectStatusDeezerAvailableEnum>
    _$connectStatusDeezerAvailableEnumSerializer =
    _$ConnectStatusDeezerAvailableEnumSerializer();

class _$ConnectStatusDeezerAvailableEnumSerializer
    implements PrimitiveSerializer<ConnectStatusDeezerAvailableEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'yes': 'yes',
    'no': 'no',
    'noNetwork': 'no-network',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'yes': 'yes',
    'no': 'no',
    'no-network': 'noNetwork',
  };

  @override
  final Iterable<Type> types = const <Type>[ConnectStatusDeezerAvailableEnum];
  @override
  final String wireName = 'ConnectStatusDeezerAvailableEnum';

  @override
  Object serialize(
          Serializers serializers, ConnectStatusDeezerAvailableEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ConnectStatusDeezerAvailableEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ConnectStatusDeezerAvailableEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ConnectStatus extends ConnectStatus {
  @override
  final bool authenticated;
  @override
  final AuthUser? user;
  @override
  final bool deezerLoggedIn;
  @override
  final DeezerUser? deezerUser;
  @override
  final ConnectStatusDeezerAvailableEnum deezerAvailable;
  @override
  final BuiltMap<String, JsonObject?> settings;

  factory _$ConnectStatus([void Function(ConnectStatusBuilder)? updates]) =>
      (ConnectStatusBuilder()..update(updates))._build();

  _$ConnectStatus._(
      {required this.authenticated,
      this.user,
      required this.deezerLoggedIn,
      this.deezerUser,
      required this.deezerAvailable,
      required this.settings})
      : super._();
  @override
  ConnectStatus rebuild(void Function(ConnectStatusBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConnectStatusBuilder toBuilder() => ConnectStatusBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConnectStatus &&
        authenticated == other.authenticated &&
        user == other.user &&
        deezerLoggedIn == other.deezerLoggedIn &&
        deezerUser == other.deezerUser &&
        deezerAvailable == other.deezerAvailable &&
        settings == other.settings;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, authenticated.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, deezerLoggedIn.hashCode);
    _$hash = $jc(_$hash, deezerUser.hashCode);
    _$hash = $jc(_$hash, deezerAvailable.hashCode);
    _$hash = $jc(_$hash, settings.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ConnectStatus')
          ..add('authenticated', authenticated)
          ..add('user', user)
          ..add('deezerLoggedIn', deezerLoggedIn)
          ..add('deezerUser', deezerUser)
          ..add('deezerAvailable', deezerAvailable)
          ..add('settings', settings))
        .toString();
  }
}

class ConnectStatusBuilder
    implements Builder<ConnectStatus, ConnectStatusBuilder> {
  _$ConnectStatus? _$v;

  bool? _authenticated;
  bool? get authenticated => _$this._authenticated;
  set authenticated(bool? authenticated) =>
      _$this._authenticated = authenticated;

  AuthUserBuilder? _user;
  AuthUserBuilder get user => _$this._user ??= AuthUserBuilder();
  set user(AuthUserBuilder? user) => _$this._user = user;

  bool? _deezerLoggedIn;
  bool? get deezerLoggedIn => _$this._deezerLoggedIn;
  set deezerLoggedIn(bool? deezerLoggedIn) =>
      _$this._deezerLoggedIn = deezerLoggedIn;

  DeezerUserBuilder? _deezerUser;
  DeezerUserBuilder get deezerUser =>
      _$this._deezerUser ??= DeezerUserBuilder();
  set deezerUser(DeezerUserBuilder? deezerUser) =>
      _$this._deezerUser = deezerUser;

  ConnectStatusDeezerAvailableEnum? _deezerAvailable;
  ConnectStatusDeezerAvailableEnum? get deezerAvailable =>
      _$this._deezerAvailable;
  set deezerAvailable(ConnectStatusDeezerAvailableEnum? deezerAvailable) =>
      _$this._deezerAvailable = deezerAvailable;

  MapBuilder<String, JsonObject?>? _settings;
  MapBuilder<String, JsonObject?> get settings =>
      _$this._settings ??= MapBuilder<String, JsonObject?>();
  set settings(MapBuilder<String, JsonObject?>? settings) =>
      _$this._settings = settings;

  ConnectStatusBuilder() {
    ConnectStatus._defaults(this);
  }

  ConnectStatusBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _authenticated = $v.authenticated;
      _user = $v.user?.toBuilder();
      _deezerLoggedIn = $v.deezerLoggedIn;
      _deezerUser = $v.deezerUser?.toBuilder();
      _deezerAvailable = $v.deezerAvailable;
      _settings = $v.settings.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConnectStatus other) {
    _$v = other as _$ConnectStatus;
  }

  @override
  void update(void Function(ConnectStatusBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ConnectStatus build() => _build();

  _$ConnectStatus _build() {
    _$ConnectStatus _$result;
    try {
      _$result = _$v ??
          _$ConnectStatus._(
            authenticated: BuiltValueNullFieldError.checkNotNull(
                authenticated, r'ConnectStatus', 'authenticated'),
            user: _user?.build(),
            deezerLoggedIn: BuiltValueNullFieldError.checkNotNull(
                deezerLoggedIn, r'ConnectStatus', 'deezerLoggedIn'),
            deezerUser: _deezerUser?.build(),
            deezerAvailable: BuiltValueNullFieldError.checkNotNull(
                deezerAvailable, r'ConnectStatus', 'deezerAvailable'),
            settings: settings.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        _user?.build();

        _$failedField = 'deezerUser';
        _deezerUser?.build();

        _$failedField = 'settings';
        settings.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ConnectStatus', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
