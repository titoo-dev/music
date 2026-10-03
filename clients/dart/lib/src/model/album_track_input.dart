//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_track_input.g.dart';

/// AlbumTrackInput
///
/// Properties:
/// * [trackId] 
/// * [title] 
/// * [artist] 
/// * [coverUrl] 
/// * [duration] - Seconds
/// * [trackNumber] 
@BuiltValue()
abstract class AlbumTrackInput implements Built<AlbumTrackInput, AlbumTrackInputBuilder> {
  @BuiltValueField(wireName: r'trackId')
  String get trackId;

  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'artist')
  String? get artist;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  /// Seconds
  @BuiltValueField(wireName: r'duration')
  int? get duration;

  @BuiltValueField(wireName: r'trackNumber')
  int? get trackNumber;

  AlbumTrackInput._();

  factory AlbumTrackInput([void updates(AlbumTrackInputBuilder b)]) = _$AlbumTrackInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumTrackInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumTrackInput> get serializer => _$AlbumTrackInputSerializer();
}

class _$AlbumTrackInputSerializer implements PrimitiveSerializer<AlbumTrackInput> {
  @override
  final Iterable<Type> types = const [AlbumTrackInput, _$AlbumTrackInput];

  @override
  final String wireName = r'AlbumTrackInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumTrackInput object, {
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
    if (object.trackNumber != null) {
      yield r'trackNumber';
      yield serializers.serialize(
        object.trackNumber,
        specifiedType: const FullType.nullable(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumTrackInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumTrackInputBuilder result,
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
  AlbumTrackInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumTrackInputBuilder();
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


