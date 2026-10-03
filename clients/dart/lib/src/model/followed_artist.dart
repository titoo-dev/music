//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'followed_artist.g.dart';

/// FollowedArtist
///
/// Properties:
/// * [id] 
/// * [userId] 
/// * [deezerArtistId] 
/// * [name] 
/// * [pictureUrl] 
/// * [followedAt] 
@BuiltValue()
abstract class FollowedArtist implements Built<FollowedArtist, FollowedArtistBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'deezerArtistId')
  String get deezerArtistId;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'pictureUrl')
  String? get pictureUrl;

  @BuiltValueField(wireName: r'followedAt')
  DateTime get followedAt;

  FollowedArtist._();

  factory FollowedArtist([void updates(FollowedArtistBuilder b)]) = _$FollowedArtist;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowedArtistBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowedArtist> get serializer => _$FollowedArtistSerializer();
}

class _$FollowedArtistSerializer implements PrimitiveSerializer<FollowedArtist> {
  @override
  final Iterable<Type> types = const [FollowedArtist, _$FollowedArtist];

  @override
  final String wireName = r'FollowedArtist';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowedArtist object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'deezerArtistId';
    yield serializers.serialize(
      object.deezerArtistId,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'pictureUrl';
    yield object.pictureUrl == null ? null : serializers.serialize(
      object.pictureUrl,
      specifiedType: const FullType.nullable(String),
    );
    yield r'followedAt';
    yield serializers.serialize(
      object.followedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowedArtist object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowedArtistBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'deezerArtistId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerArtistId = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'pictureUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.pictureUrl = valueDes;
          break;
        case r'followedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.followedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FollowedArtist deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowedArtistBuilder();
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


