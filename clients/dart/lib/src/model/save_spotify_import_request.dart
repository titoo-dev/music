//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/imported_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'save_spotify_import_request.g.dart';

/// SaveSpotifyImportRequest
///
/// Properties:
/// * [title] - default \"Spotify import\"
/// * [description] 
/// * [coverUrl] - https only; else the first track's cover
/// * [tracks] 
@BuiltValue()
abstract class SaveSpotifyImportRequest implements Built<SaveSpotifyImportRequest, SaveSpotifyImportRequestBuilder> {
  /// default \"Spotify import\"
  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  /// https only; else the first track's cover
  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  @BuiltValueField(wireName: r'tracks')
  BuiltList<ImportedTrack> get tracks;

  SaveSpotifyImportRequest._();

  factory SaveSpotifyImportRequest([void updates(SaveSpotifyImportRequestBuilder b)]) = _$SaveSpotifyImportRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SaveSpotifyImportRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SaveSpotifyImportRequest> get serializer => _$SaveSpotifyImportRequestSerializer();
}

class _$SaveSpotifyImportRequestSerializer implements PrimitiveSerializer<SaveSpotifyImportRequest> {
  @override
  final Iterable<Type> types = const [SaveSpotifyImportRequest, _$SaveSpotifyImportRequest];

  @override
  final String wireName = r'SaveSpotifyImportRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SaveSpotifyImportRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
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
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(ImportedTrack)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SaveSpotifyImportRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SaveSpotifyImportRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
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
            specifiedType: const FullType(BuiltList, [FullType(ImportedTrack)]),
          ) as BuiltList<ImportedTrack>;
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
  SaveSpotifyImportRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SaveSpotifyImportRequestBuilder();
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


