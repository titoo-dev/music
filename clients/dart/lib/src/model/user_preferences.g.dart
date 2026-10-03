// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_preferences.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserPreferencesPlaylistSortOrderEnum
    _$userPreferencesPlaylistSortOrderEnum_asc =
    const UserPreferencesPlaylistSortOrderEnum._('asc');
const UserPreferencesPlaylistSortOrderEnum
    _$userPreferencesPlaylistSortOrderEnum_desc =
    const UserPreferencesPlaylistSortOrderEnum._('desc');

UserPreferencesPlaylistSortOrderEnum
    _$userPreferencesPlaylistSortOrderEnumValueOf(String name) {
  switch (name) {
    case 'asc':
      return _$userPreferencesPlaylistSortOrderEnum_asc;
    case 'desc':
      return _$userPreferencesPlaylistSortOrderEnum_desc;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserPreferencesPlaylistSortOrderEnum>
    _$userPreferencesPlaylistSortOrderEnumValues = BuiltSet<
        UserPreferencesPlaylistSortOrderEnum>(const <UserPreferencesPlaylistSortOrderEnum>[
  _$userPreferencesPlaylistSortOrderEnum_asc,
  _$userPreferencesPlaylistSortOrderEnum_desc,
]);

const UserPreferencesAlbumSortOrderEnum
    _$userPreferencesAlbumSortOrderEnum_asc =
    const UserPreferencesAlbumSortOrderEnum._('asc');
const UserPreferencesAlbumSortOrderEnum
    _$userPreferencesAlbumSortOrderEnum_desc =
    const UserPreferencesAlbumSortOrderEnum._('desc');

UserPreferencesAlbumSortOrderEnum _$userPreferencesAlbumSortOrderEnumValueOf(
    String name) {
  switch (name) {
    case 'asc':
      return _$userPreferencesAlbumSortOrderEnum_asc;
    case 'desc':
      return _$userPreferencesAlbumSortOrderEnum_desc;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserPreferencesAlbumSortOrderEnum>
    _$userPreferencesAlbumSortOrderEnumValues = BuiltSet<
        UserPreferencesAlbumSortOrderEnum>(const <UserPreferencesAlbumSortOrderEnum>[
  _$userPreferencesAlbumSortOrderEnum_asc,
  _$userPreferencesAlbumSortOrderEnum_desc,
]);

Serializer<UserPreferencesPlaylistSortOrderEnum>
    _$userPreferencesPlaylistSortOrderEnumSerializer =
    _$UserPreferencesPlaylistSortOrderEnumSerializer();
Serializer<UserPreferencesAlbumSortOrderEnum>
    _$userPreferencesAlbumSortOrderEnumSerializer =
    _$UserPreferencesAlbumSortOrderEnumSerializer();

class _$UserPreferencesPlaylistSortOrderEnumSerializer
    implements PrimitiveSerializer<UserPreferencesPlaylistSortOrderEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'asc': 'asc',
    'desc': 'desc',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'asc': 'asc',
    'desc': 'desc',
  };

  @override
  final Iterable<Type> types = const <Type>[
    UserPreferencesPlaylistSortOrderEnum
  ];
  @override
  final String wireName = 'UserPreferencesPlaylistSortOrderEnum';

  @override
  Object serialize(
          Serializers serializers, UserPreferencesPlaylistSortOrderEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserPreferencesPlaylistSortOrderEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserPreferencesPlaylistSortOrderEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserPreferencesAlbumSortOrderEnumSerializer
    implements PrimitiveSerializer<UserPreferencesAlbumSortOrderEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'asc': 'asc',
    'desc': 'desc',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'asc': 'asc',
    'desc': 'desc',
  };

  @override
  final Iterable<Type> types = const <Type>[UserPreferencesAlbumSortOrderEnum];
  @override
  final String wireName = 'UserPreferencesAlbumSortOrderEnum';

  @override
  Object serialize(
          Serializers serializers, UserPreferencesAlbumSortOrderEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserPreferencesAlbumSortOrderEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserPreferencesAlbumSortOrderEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserPreferences extends UserPreferences {
  @override
  final UserPreferencesPlaylistSortOrderEnum? playlistSortOrder;
  @override
  final UserPreferencesAlbumSortOrderEnum? albumSortOrder;
  @override
  final bool? preCacheSaved;

  factory _$UserPreferences([void Function(UserPreferencesBuilder)? updates]) =>
      (UserPreferencesBuilder()..update(updates))._build();

  _$UserPreferences._(
      {this.playlistSortOrder, this.albumSortOrder, this.preCacheSaved})
      : super._();
  @override
  UserPreferences rebuild(void Function(UserPreferencesBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserPreferencesBuilder toBuilder() => UserPreferencesBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserPreferences &&
        playlistSortOrder == other.playlistSortOrder &&
        albumSortOrder == other.albumSortOrder &&
        preCacheSaved == other.preCacheSaved;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, playlistSortOrder.hashCode);
    _$hash = $jc(_$hash, albumSortOrder.hashCode);
    _$hash = $jc(_$hash, preCacheSaved.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserPreferences')
          ..add('playlistSortOrder', playlistSortOrder)
          ..add('albumSortOrder', albumSortOrder)
          ..add('preCacheSaved', preCacheSaved))
        .toString();
  }
}

class UserPreferencesBuilder
    implements Builder<UserPreferences, UserPreferencesBuilder> {
  _$UserPreferences? _$v;

  UserPreferencesPlaylistSortOrderEnum? _playlistSortOrder;
  UserPreferencesPlaylistSortOrderEnum? get playlistSortOrder =>
      _$this._playlistSortOrder;
  set playlistSortOrder(
          UserPreferencesPlaylistSortOrderEnum? playlistSortOrder) =>
      _$this._playlistSortOrder = playlistSortOrder;

  UserPreferencesAlbumSortOrderEnum? _albumSortOrder;
  UserPreferencesAlbumSortOrderEnum? get albumSortOrder =>
      _$this._albumSortOrder;
  set albumSortOrder(UserPreferencesAlbumSortOrderEnum? albumSortOrder) =>
      _$this._albumSortOrder = albumSortOrder;

  bool? _preCacheSaved;
  bool? get preCacheSaved => _$this._preCacheSaved;
  set preCacheSaved(bool? preCacheSaved) =>
      _$this._preCacheSaved = preCacheSaved;

  UserPreferencesBuilder() {
    UserPreferences._defaults(this);
  }

  UserPreferencesBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _playlistSortOrder = $v.playlistSortOrder;
      _albumSortOrder = $v.albumSortOrder;
      _preCacheSaved = $v.preCacheSaved;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserPreferences other) {
    _$v = other as _$UserPreferences;
  }

  @override
  void update(void Function(UserPreferencesBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserPreferences build() => _build();

  _$UserPreferences _build() {
    final _$result = _$v ??
        _$UserPreferences._(
          playlistSortOrder: playlistSortOrder,
          albumSortOrder: albumSortOrder,
          preCacheSaved: preCacheSaved,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
