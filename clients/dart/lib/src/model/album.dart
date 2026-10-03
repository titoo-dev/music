//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album.g.dart';

/// Album
///
/// Properties:
/// * [id] - Internal id (cuid) — use this for /library/albums/{albumId}
/// * [userId] 
/// * [deezerAlbumId] 
/// * [title] 
/// * [artist] 
/// * [coverUrl] 
/// * [trackCount] 
/// * [savedAt] 
@BuiltValue(instantiable: false)
abstract class Album  {
  /// Internal id (cuid) — use this for /library/albums/{albumId}
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'deezerAlbumId')
  String get deezerAlbumId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artist')
  String get artist;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'trackCount')
  int get trackCount;

  @BuiltValueField(wireName: r'savedAt')
  DateTime get savedAt;

  @BuiltValueSerializer(custom: true)
  static Serializer<Album> get serializer => _$AlbumSerializer();
}

class _$AlbumSerializer implements PrimitiveSerializer<Album> {
  @override
  final Iterable<Type> types = const [Album];

  @override
  final String wireName = r'Album';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Album object, {
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
    yield r'deezerAlbumId';
    yield serializers.serialize(
      object.deezerAlbumId,
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
    yield r'coverUrl';
    yield object.coverUrl == null ? null : serializers.serialize(
      object.coverUrl,
      specifiedType: const FullType.nullable(String),
    );
    yield r'trackCount';
    yield serializers.serialize(
      object.trackCount,
      specifiedType: const FullType(int),
    );
    yield r'savedAt';
    yield serializers.serialize(
      object.savedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Album object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  @override
  Album deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized, specifiedType: FullType($Album)) as $Album;
  }
}


/// a concrete implementation of [Album], since [Album] is not instantiable
@BuiltValue(instantiable: true)
abstract class $Album implements Album, Built<$Album, $AlbumBuilder> {
  $Album._();

  factory $Album([void Function($AlbumBuilder)? updates]) = _$$Album;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($AlbumBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$Album> get serializer => _$$AlbumSerializer();
}

class _$$AlbumSerializer implements PrimitiveSerializer<$Album> {
  @override
  final Iterable<Type> types = const [$Album, _$$Album];

  @override
  final String wireName = r'$Album';

  @override
  Object serialize(
    Serializers serializers,
    $Album object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(Album))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumBuilder result,
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
        case r'deezerAlbumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerAlbumId = valueDes;
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
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        case r'trackCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.trackCount = valueDes;
          break;
        case r'savedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.savedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  $Album deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $AlbumBuilder();
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

