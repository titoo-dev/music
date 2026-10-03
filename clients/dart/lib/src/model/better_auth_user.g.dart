// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'better_auth_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BetterAuthUser extends BetterAuthUser {
  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final bool? emailVerified;
  @override
  final String? image;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  factory _$BetterAuthUser([void Function(BetterAuthUserBuilder)? updates]) =>
      (BetterAuthUserBuilder()..update(updates))._build();

  _$BetterAuthUser._(
      {required this.id,
      required this.name,
      required this.email,
      this.emailVerified,
      this.image,
      this.createdAt,
      this.updatedAt})
      : super._();
  @override
  BetterAuthUser rebuild(void Function(BetterAuthUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BetterAuthUserBuilder toBuilder() => BetterAuthUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BetterAuthUser &&
        id == other.id &&
        name == other.name &&
        email == other.email &&
        emailVerified == other.emailVerified &&
        image == other.image &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, emailVerified.hashCode);
    _$hash = $jc(_$hash, image.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BetterAuthUser')
          ..add('id', id)
          ..add('name', name)
          ..add('email', email)
          ..add('emailVerified', emailVerified)
          ..add('image', image)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class BetterAuthUserBuilder
    implements Builder<BetterAuthUser, BetterAuthUserBuilder> {
  _$BetterAuthUser? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  bool? _emailVerified;
  bool? get emailVerified => _$this._emailVerified;
  set emailVerified(bool? emailVerified) =>
      _$this._emailVerified = emailVerified;

  String? _image;
  String? get image => _$this._image;
  set image(String? image) => _$this._image = image;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  BetterAuthUserBuilder() {
    BetterAuthUser._defaults(this);
  }

  BetterAuthUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _email = $v.email;
      _emailVerified = $v.emailVerified;
      _image = $v.image;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BetterAuthUser other) {
    _$v = other as _$BetterAuthUser;
  }

  @override
  void update(void Function(BetterAuthUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BetterAuthUser build() => _build();

  _$BetterAuthUser _build() {
    final _$result = _$v ??
        _$BetterAuthUser._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'BetterAuthUser', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'BetterAuthUser', 'name'),
          email: BuiltValueNullFieldError.checkNotNull(
              email, r'BetterAuthUser', 'email'),
          emailVerified: emailVerified,
          image: image,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
