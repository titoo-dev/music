//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/album_track_input.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'save_album_input.g.dart';

/// SaveAlbumInput
///
/// Properties:
/// * [deezerAlbumId] 
/// * [title] 
/// * [artist] 
/// * [coverUrl] 
/// * [tracks] 
@BuiltValue()
abstract class SaveAlbumInput implements Built<SaveAlbumInput, SaveAlbumInputBuilder> {
  @BuiltValueField(wireName: r'deezerAlbumId')
  String get deezerAlbumId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artist')
  String get artist;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'tracks')
  BuiltList<AlbumTrackInput> get tracks;

  SaveAlbumInput._();

  factory SaveAlbumInput([void updates(SaveAlbumInputBuilder b)]) = _$SaveAlbumInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SaveAlbumInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SaveAlbumInput> get serializer => _$SaveAlbumInputSerializer();
}

class _$SaveAlbumInputSerializer implements PrimitiveSerializer<SaveAlbumInput> {
  @override
  final Iterable<Type> types = const [SaveAlbumInput, _$SaveAlbumInput];

  @override
  final String wireName = r'SaveAlbumInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SaveAlbumInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    if (object.coverUrl != null) {
      yield r'coverUrl';
      yield serializers.serialize(
        object.coverUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(AlbumTrackInput)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SaveAlbumInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SaveAlbumInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AlbumTrackInput)]),
          ) as BuiltList<AlbumTrackInput>;
          result.tracks.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SaveAlbumInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SaveAlbumInputBuilder();
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


