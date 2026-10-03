// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'better_auth_session_session.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BetterAuthSessionSession extends BetterAuthSessionSession {
  @override
  final String id;
  @override
  final String userId;
  @override
  final String token;
  @override
  final DateTime expiresAt;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final String? ipAddress;
  @override
  final String? userAgent;

  factory _$BetterAuthSessionSession(
          [void Function(BetterAuthSessionSessionBuilder)? updates]) =>
      (BetterAuthSessionSessionBuilder()..update(updates))._build();

  _$BetterAuthSessionSession._(
      {required this.id,
      required this.userId,
      required this.token,
      required this.expiresAt,
      this.createdAt,
      this.updatedAt,
      this.ipAddress,
      this.userAgent})
      : super._();
  @override
  BetterAuthSessionSession rebuild(
          void Function(BetterAuthSessionSessionBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BetterAuthSessionSessionBuilder toBuilder() =>
      BetterAuthSessionSessionBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BetterAuthSessionSession &&
        id == other.id &&
        userId == other.userId &&
        token == other.token &&
        expiresAt == other.expiresAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        ipAddress == other.ipAddress &&
        userAgent == other.userAgent;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, userAgent.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BetterAuthSessionSession')
          ..add('id', id)
          ..add('userId', userId)
          ..add('token', token)
          ..add('expiresAt', expiresAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('ipAddress', ipAddress)
          ..add('userAgent', userAgent))
        .toString();
  }
}

class BetterAuthSessionSessionBuilder
    implements
        Builder<BetterAuthSessionSession, BetterAuthSessionSessionBuilder> {
  _$BetterAuthSessionSession? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  String? _ipAddress;
  String? get ipAddress => _$this._ipAddress;
  set ipAddress(String? ipAddress) => _$this._ipAddress = ipAddress;

  String? _userAgent;
  String? get userAgent => _$this._userAgent;
  set userAgent(String? userAgent) => _$this._userAgent = userAgent;

  BetterAuthSessionSessionBuilder() {
    BetterAuthSessionSession._defaults(this);
  }

  BetterAuthSessionSessionBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _token = $v.token;
      _expiresAt = $v.expiresAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _ipAddress = $v.ipAddress;
      _userAgent = $v.userAgent;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BetterAuthSessionSession other) {
    _$v = other as _$BetterAuthSessionSession;
  }

  @override
  void update(void Function(BetterAuthSessionSessionBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BetterAuthSessionSession build() => _build();

  _$BetterAuthSessionSession _build() {
    final _$result = _$v ??
        _$BetterAuthSessionSession._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'BetterAuthSessionSession', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'BetterAuthSessionSession', 'userId'),
          token: BuiltValueNullFieldError.checkNotNull(
              token, r'BetterAuthSessionSession', 'token'),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
              expiresAt, r'BetterAuthSessionSession', 'expiresAt'),
          createdAt: createdAt,
          updatedAt: updatedAt,
          ipAddress: ipAddress,
          userAgent: userAgent,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
