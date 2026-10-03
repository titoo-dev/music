// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'better_auth_session.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BetterAuthSession extends BetterAuthSession {
  @override
  final BetterAuthSessionSession session;
  @override
  final BetterAuthUser user;

  factory _$BetterAuthSession(
          [void Function(BetterAuthSessionBuilder)? updates]) =>
      (BetterAuthSessionBuilder()..update(updates))._build();

  _$BetterAuthSession._({required this.session, required this.user})
      : super._();
  @override
  BetterAuthSession rebuild(void Function(BetterAuthSessionBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BetterAuthSessionBuilder toBuilder() =>
      BetterAuthSessionBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BetterAuthSession &&
        session == other.session &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, session.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BetterAuthSession')
          ..add('session', session)
          ..add('user', user))
        .toString();
  }
}

class BetterAuthSessionBuilder
    implements Builder<BetterAuthSession, BetterAuthSessionBuilder> {
  _$BetterAuthSession? _$v;

  BetterAuthSessionSessionBuilder? _session;
  BetterAuthSessionSessionBuilder get session =>
      _$this._session ??= BetterAuthSessionSessionBuilder();
  set session(BetterAuthSessionSessionBuilder? session) =>
      _$this._session = session;

  BetterAuthUserBuilder? _user;
  BetterAuthUserBuilder get user => _$this._user ??= BetterAuthUserBuilder();
  set user(BetterAuthUserBuilder? user) => _$this._user = user;

  BetterAuthSessionBuilder() {
    BetterAuthSession._defaults(this);
  }

  BetterAuthSessionBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _session = $v.session.toBuilder();
      _user = $v.user.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BetterAuthSession other) {
    _$v = other as _$BetterAuthSession;
  }

  @override
  void update(void Function(BetterAuthSessionBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BetterAuthSession build() => _build();

  _$BetterAuthSession _build() {
    _$BetterAuthSession _$result;
    try {
      _$result = _$v ??
          _$BetterAuthSession._(
            session: session.build(),
            user: user.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'session';
        session.build();
        _$failedField = 'user';
        user.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'BetterAuthSession', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
