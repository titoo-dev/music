//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_preferences.g.dart';

/// UserPreferences
///
/// Properties:
/// * [playlistSortOrder] 
/// * [albumSortOrder] 
/// * [preCacheSaved] - Warm the R2 cache when saving a track/album
@BuiltValue()
abstract class UserPreferences implements Built<UserPreferences, UserPreferencesBuilder> {
  @BuiltValueField(wireName: r'playlistSortOrder')
  UserPreferencesPlaylistSortOrderEnum? get playlistSortOrder;
  // enum playlistSortOrderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'albumSortOrder')
  UserPreferencesAlbumSortOrderEnum? get albumSortOrder;
  // enum albumSortOrderEnum {  asc,  desc,  };

  /// Warm the R2 cache when saving a track/album
  @BuiltValueField(wireName: r'preCacheSaved')
  bool? get preCacheSaved;

  UserPreferences._();

  factory UserPreferences([void updates(UserPreferencesBuilder b)]) = _$UserPreferences;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserPreferencesBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserPreferences> get serializer => _$UserPreferencesSerializer();
}

class _$UserPreferencesSerializer implements PrimitiveSerializer<UserPreferences> {
  @override
  final Iterable<Type> types = const [UserPreferences, _$UserPreferences];

  @override
  final String wireName = r'UserPreferences';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserPreferences object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.playlistSortOrder != null) {
      yield r'playlistSortOrder';
      yield serializers.serialize(
        object.playlistSortOrder,
        specifiedType: const FullType(UserPreferencesPlaylistSortOrderEnum),
      );
    }
    if (object.albumSortOrder != null) {
      yield r'albumSortOrder';
      yield serializers.serialize(
        object.albumSortOrder,
        specifiedType: const FullType(UserPreferencesAlbumSortOrderEnum),
      );
    }
    if (object.preCacheSaved != null) {
      yield r'preCacheSaved';
      yield serializers.serialize(
        object.preCacheSaved,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UserPreferences object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserPreferencesBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'playlistSortOrder':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(UserPreferencesPlaylistSortOrderEnum),
          ) as UserPreferencesPlaylistSortOrderEnum?;
          if (valueDes == null) continue;
          result.playlistSortOrder = valueDes;
          break;
        case r'albumSortOrder':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(UserPreferencesAlbumSortOrderEnum),
          ) as UserPreferencesAlbumSortOrderEnum?;
          if (valueDes == null) continue;
          result.albumSortOrder = valueDes;
          break;
        case r'preCacheSaved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.preCacheSaved = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserPreferences deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserPreferencesBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}


class UserPreferencesPlaylistSortOrderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const UserPreferencesPlaylistSortOrderEnum asc = _$userPreferencesPlaylistSortOrderEnum_asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const UserPreferencesPlaylistSortOrderEnum desc = _$userPreferencesPlaylistSortOrderEnum_desc;

  static Serializer<UserPreferencesPlaylistSortOrderEnum> get serializer => _$userPreferencesPlaylistSortOrderEnumSerializer;

  const UserPreferencesPlaylistSortOrderEnum._(String name): super(name);

  static BuiltSet<UserPreferencesPlaylistSortOrderEnum> get values => _$userPreferencesPlaylistSortOrderEnumValues;
  static UserPreferencesPlaylistSortOrderEnum valueOf(String name) => _$userPreferencesPlaylistSortOrderEnumValueOf(name);
}

class UserPreferencesAlbumSortOrderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const UserPreferencesAlbumSortOrderEnum asc = _$userPreferencesAlbumSortOrderEnum_asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const UserPreferencesAlbumSortOrderEnum desc = _$userPreferencesAlbumSortOrderEnum_desc;

  static Serializer<UserPreferencesAlbumSortOrderEnum> get serializer => _$userPreferencesAlbumSortOrderEnumSerializer;

  const UserPreferencesAlbumSortOrderEnum._(String name): super(name);

  static BuiltSet<UserPreferencesAlbumSortOrderEnum> get values => _$userPreferencesAlbumSortOrderEnumValues;
  static UserPreferencesAlbumSortOrderEnum valueOf(String name) => _$userPreferencesAlbumSortOrderEnumValueOf(name);
}

