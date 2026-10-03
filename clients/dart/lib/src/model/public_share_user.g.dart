// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_share_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PublicShareUser extends PublicShareUser {
  @override
  final String name;
  @override
  final String? image;

  factory _$PublicShareUser([void Function(PublicShareUserBuilder)? updates]) =>
      (PublicShareUserBuilder()..update(updates))._build();

  _$PublicShareUser._({required this.name, this.image}) : super._();
  @override
  PublicShareUser rebuild(void Function(PublicShareUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PublicShareUserBuilder toBuilder() => PublicShareUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PublicShareUser &&
        name == other.name &&
        image == other.image;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, image.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PublicShareUser')
          ..add('name', name)
          ..add('image', image))
        .toString();
  }
}

class PublicShareUserBuilder
    implements Builder<PublicShareUser, PublicShareUserBuilder> {
  _$PublicShareUser? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _image;
  String? get image => _$this._image;
  set image(String? image) => _$this._image = image;

  PublicShareUserBuilder() {
    PublicShareUser._defaults(this);
  }

  PublicShareUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _image = $v.image;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PublicShareUser other) {
    _$v = other as _$PublicShareUser;
  }

  @override
  void update(void Function(PublicShareUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PublicShareUser build() => _build();

  _$PublicShareUser _build() {
    final _$result = _$v ??
        _$PublicShareUser._(
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'PublicShareUser', 'name'),
          image: image,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
