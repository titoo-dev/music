// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthUser extends AuthUser {
  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final String? image;

  factory _$AuthUser([void Function(AuthUserBuilder)? updates]) =>
      (AuthUserBuilder()..update(updates))._build();

  _$AuthUser._(
      {required this.id, required this.name, required this.email, this.image})
      : super._();
  @override
  AuthUser rebuild(void Function(AuthUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthUserBuilder toBuilder() => AuthUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthUser &&
        id == other.id &&
        name == other.name &&
        email == other.email &&
        image == other.image;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, image.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthUser')
          ..add('id', id)
          ..add('name', name)
          ..add('email', email)
          ..add('image', image))
        .toString();
  }
}

class AuthUserBuilder implements Builder<AuthUser, AuthUserBuilder> {
  _$AuthUser? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _image;
  String? get image => _$this._image;
  set image(String? image) => _$this._image = image;

  AuthUserBuilder() {
    AuthUser._defaults(this);
  }

  AuthUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _email = $v.email;
      _image = $v.image;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthUser other) {
    _$v = other as _$AuthUser;
  }

  @override
  void update(void Function(AuthUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthUser build() => _build();

  _$AuthUser _build() {
    final _$result = _$v ??
        _$AuthUser._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'AuthUser', 'id'),
          name:
              BuiltValueNullFieldError.checkNotNull(name, r'AuthUser', 'name'),
          email: BuiltValueNullFieldError.checkNotNull(
              email, r'AuthUser', 'email'),
          image: image,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
