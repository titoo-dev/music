//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_track.g.dart';

/// AlbumTrack
///
/// Properties:
/// * [id] 
/// * [albumId] 
/// * [trackId] 
/// * [title] 
/// * [artist] 
/// * [coverUrl] 
/// * [duration] 
/// * [trackNumber] 
@BuiltValue()
abstract class AlbumTrack implements Built<AlbumTrack, AlbumTrackBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'albumId')
  String get albumId;

  @BuiltValueField(wireName: r'trackId')
  String get trackId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artist')
  String get artist;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'duration')
  int? get duration;

  @BuiltValueField(wireName: r'trackNumber')
  int? get trackNumber;

  AlbumTrack._();

  factory AlbumTrack([void updates(AlbumTrackBuilder b)]) = _$AlbumTrack;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumTrackBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumTrack> get serializer => _$AlbumTrackSerializer();
}

class _$AlbumTrackSerializer implements PrimitiveSerializer<AlbumTrack> {
  @override
  final Iterable<Type> types = const [AlbumTrack, _$AlbumTrack];

  @override
  final String wireName = r'AlbumTrack';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumTrack object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'albumId';
    yield serializers.serialize(
      object.albumId,
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
    yield r'trackNumber';
    yield object.trackNumber == null ? null : serializers.serialize(
      object.trackNumber,
      specifiedType: const FullType.nullable(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumTrack object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumTrackBuilder result,
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
        case r'albumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.albumId = valueDes;
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
        case r'trackNumber':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.trackNumber = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AlbumTrack deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumTrackBuilder();
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


