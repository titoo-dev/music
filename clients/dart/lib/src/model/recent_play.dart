//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recent_play.g.dart';

/// RecentPlay
///
/// Properties:
/// * [id] 
/// * [userId] 
/// * [trackId] 
/// * [title] 
/// * [artist] 
/// * [album] 
/// * [albumId] 
/// * [coverUrl] 
/// * [duration] 
/// * [playedAt] 
@BuiltValue()
abstract class RecentPlay implements Built<RecentPlay, RecentPlayBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'trackId')
  String get trackId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artist')
  String get artist;

  @BuiltValueField(wireName: r'album')
  String? get album;

  @BuiltValueField(wireName: r'albumId')
  String? get albumId;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'duration')
  int? get duration;

  @BuiltValueField(wireName: r'playedAt')
  DateTime get playedAt;

  RecentPlay._();

  factory RecentPlay([void updates(RecentPlayBuilder b)]) = _$RecentPlay;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentPlayBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentPlay> get serializer => _$RecentPlaySerializer();
}

class _$RecentPlaySerializer implements PrimitiveSerializer<RecentPlay> {
  @override
  final Iterable<Type> types = const [RecentPlay, _$RecentPlay];

  @override
  final String wireName = r'RecentPlay';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentPlay object, {
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
    yield r'trackId';
    yield serializers.serialize(
      object.trackId,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'artist';
    yield serializers.serialize(
      object.artist,
      specifiedType: const FullType(String),
    );
    yield r'album';
    yield object.album == null ? null : serializers.serialize(
      object.album,
      specifiedType: const FullType.nullable(String),
    );
    yield r'albumId';
    yield object.albumId == null ? null : serializers.serialize(
      object.albumId,
      specifiedType: const FullType.nullable(String),
    );
    yield r'coverUrl';
    yield object.coverUrl == null ? null : serializers.serialize(
      object.coverUrl,
      specifiedType: const FullType.nullable(String),
    );
    yield r'duration';
    yield object.duration == null ? null : serializers.serialize(
      object.duration,
      specifiedType: const FullType.nullable(int),
    );
    yield r'playedAt';
    yield serializers.serialize(
      object.playedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentPlay object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentPlayBuilder result,
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
        case r'trackId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.trackId = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'artist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.artist = valueDes;
          break;
        case r'album':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.album = valueDes;
          break;
        case r'albumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.albumId = valueDes;
          break;
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.duration = valueDes;
          break;
        case r'playedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.playedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecentPlay deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentPlayBuilder();
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


