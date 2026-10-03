//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'playlist_track_input.g.dart';

/// PlaylistTrackInput
///
/// Properties:
/// * [trackId] 
/// * [title] 
/// * [artist] 
/// * [album] 
/// * [albumId] 
/// * [coverUrl] 
/// * [duration] 
@BuiltValue()
abstract class PlaylistTrackInput implements Built<PlaylistTrackInput, PlaylistTrackInputBuilder> {
  @BuiltValueField(wireName: r'trackId')
  String get trackId;

  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'artist')
  String? get artist;

  @BuiltValueField(wireName: r'album')
  String? get album;

  @BuiltValueField(wireName: r'albumId')
  String? get albumId;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'duration')
  int? get duration;

  PlaylistTrackInput._();

  factory PlaylistTrackInput([void updates(PlaylistTrackInputBuilder b)]) = _$PlaylistTrackInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PlaylistTrackInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PlaylistTrackInput> get serializer => _$PlaylistTrackInputSerializer();
}

class _$PlaylistTrackInputSerializer implements PrimitiveSerializer<PlaylistTrackInput> {
  @override
  final Iterable<Type> types = const [PlaylistTrackInput, _$PlaylistTrackInput];

  @override
  final String wireName = r'PlaylistTrackInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PlaylistTrackInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'trackId';
    yield serializers.serialize(
      object.trackId,
      specifiedType: const FullType(String),
    );
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.artist != null) {
      yield r'artist';
      yield serializers.serialize(
        object.artist,
        specifiedType: const FullType(String),
      );
    }
    if (object.album != null) {
      yield r'album';
      yield serializers.serialize(
        object.album,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.albumId != null) {
      yield r'albumId';
      yield serializers.serialize(
        object.albumId,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.coverUrl != null) {
      yield r'coverUrl';
      yield serializers.serialize(
        object.coverUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.duration != null) {
      yield r'duration';
      yield serializers.serialize(
        object.duration,
        specifiedType: const FullType.nullable(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    PlaylistTrackInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PlaylistTrackInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.title = valueDes;
          break;
        case r'artist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PlaylistTrackInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PlaylistTrackInputBuilder();
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


