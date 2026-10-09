// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerUser extends DeezerUser {
  @override
  final DeezerUserId? id;
  @override
  final String? name;
  @override
  final String? picture;
  @override
  final bool? canStreamHq;
  @override
  final bool? canStreamLossless;
  @override
  final String? country;
  @override
  final String? language;
  @override
  final DeezerUserLovedTracks? lovedTracks;

  factory _$DeezerUser([void Function(DeezerUserBuilder)? updates]) =>
      (DeezerUserBuilder()..update(updates))._build();

  _$DeezerUser._(
      {this.id,
      this.name,
      this.picture,
      this.canStreamHq,
      this.canStreamLossless,
      this.country,
      this.language,
      this.lovedTracks})
      : super._();
  @override
  DeezerUser rebuild(void Function(DeezerUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerUserBuilder toBuilder() => DeezerUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerUser &&
        id == other.id &&
        name == other.name &&
        picture == other.picture &&
        canStreamHq == other.canStreamHq &&
        canStreamLossless == other.canStreamLossless &&
        country == other.country &&
        language == other.language &&
        lovedTracks == other.lovedTracks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, picture.hashCode);
    _$hash = $jc(_$hash, canStreamHq.hashCode);
    _$hash = $jc(_$hash, canStreamLossless.hashCode);
    _$hash = $jc(_$hash, country.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, lovedTracks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeezerUser')
          ..add('id', id)
          ..add('name', name)
          ..add('picture', picture)
          ..add('canStreamHq', canStreamHq)
          ..add('canStreamLossless', canStreamLossless)
          ..add('country', country)
          ..add('language', language)
          ..add('lovedTracks', lovedTracks))
        .toString();
  }
}

class DeezerUserBuilder implements Builder<DeezerUser, DeezerUserBuilder> {
  _$DeezerUser? _$v;

  DeezerUserIdBuilder? _id;
  DeezerUserIdBuilder get id => _$this._id ??= DeezerUserIdBuilder();
  set id(DeezerUserIdBuilder? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _picture;
  String? get picture => _$this._picture;
  set picture(String? picture) => _$this._picture = picture;

  bool? _canStreamHq;
  bool? get canStreamHq => _$this._canStreamHq;
  set canStreamHq(bool? canStreamHq) => _$this._canStreamHq = canStreamHq;

  bool? _canStreamLossless;
  bool? get canStreamLossless => _$this._canStreamLossless;
  set canStreamLossless(bool? canStreamLossless) =>
      _$this._canStreamLossless = canStreamLossless;

  String? _country;
  String? get country => _$this._country;
  set country(String? country) => _$this._country = country;

  String? _language;
  String? get language => _$this._language;
  set language(String? language) => _$this._language = language;

  DeezerUserLovedTracksBuilder? _lovedTracks;
  DeezerUserLovedTracksBuilder get lovedTracks =>
      _$this._lovedTracks ??= DeezerUserLovedTracksBuilder();
  set lovedTracks(DeezerUserLovedTracksBuilder? lovedTracks) =>
      _$this._lovedTracks = lovedTracks;

  DeezerUserBuilder() {
    DeezerUser._defaults(this);
  }

  DeezerUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id?.toBuilder();
      _name = $v.name;
      _picture = $v.picture;
      _canStreamHq = $v.canStreamHq;
      _canStreamLossless = $v.canStreamLossless;
      _country = $v.country;
      _language = $v.language;
      _lovedTracks = $v.lovedTracks?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerUser other) {
    _$v = other as _$DeezerUser;
  }

  @override
  void update(void Function(DeezerUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerUser build() => _build();

  _$DeezerUser _build() {
    _$DeezerUser _$result;
    try {
      _$result = _$v ??
          _$DeezerUser._(
            id: _id?.build(),
            name: name,
            picture: picture,
            canStreamHq: canStreamHq,
            canStreamLossless: canStreamLossless,
            country: country,
            language: language,
            lovedTracks: _lovedTracks?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'id';
        _id?.build();

        _$failedField = 'lovedTracks';
        _lovedTracks?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerUser', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
