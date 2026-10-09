//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'import_spotify_playlist_request_one_of.g.dart';

/// ImportSpotifyPlaylistRequestOneOf
///
/// Properties:
/// * [url] - Spotify playlist URL, URI or id (first 100 tracks without API access)
@BuiltValue()
abstract class ImportSpotifyPlaylistRequestOneOf implements Built<ImportSpotifyPlaylistRequestOneOf, ImportSpotifyPlaylistRequestOneOfBuilder> {
  /// Spotify playlist URL, URI or id (first 100 tracks without API access)
  @BuiltValueField(wireName: r'url')
  String get url;

  ImportSpotifyPlaylistRequestOneOf._();

  factory ImportSpotifyPlaylistRequestOneOf([void updates(ImportSpotifyPlaylistRequestOneOfBuilder b)]) = _$ImportSpotifyPlaylistRequestOneOf;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportSpotifyPlaylistRequestOneOfBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportSpotifyPlaylistRequestOneOf> get serializer => _$ImportSpotifyPlaylistRequestOneOfSerializer();
}

class _$ImportSpotifyPlaylistRequestOneOfSerializer implements PrimitiveSerializer<ImportSpotifyPlaylistRequestOneOf> {
  @override
  final Iterable<Type> types = const [ImportSpotifyPlaylistRequestOneOf, _$ImportSpotifyPlaylistRequestOneOf];

  @override
  final String wireName = r'ImportSpotifyPlaylistRequestOneOf';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportSpotifyPlaylistRequestOneOf object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ImportSpotifyPlaylistRequestOneOf object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ImportSpotifyPlaylistRequestOneOfBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ImportSpotifyPlaylistRequestOneOf deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportSpotifyPlaylistRequestOneOfBuilder();
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


