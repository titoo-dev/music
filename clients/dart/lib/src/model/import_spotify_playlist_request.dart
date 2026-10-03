//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'import_spotify_playlist_request.g.dart';

/// ImportSpotifyPlaylistRequest
///
/// Properties:
/// * [url] - Spotify playlist URL, URI or id
@BuiltValue()
abstract class ImportSpotifyPlaylistRequest implements Built<ImportSpotifyPlaylistRequest, ImportSpotifyPlaylistRequestBuilder> {
  /// Spotify playlist URL, URI or id
  @BuiltValueField(wireName: r'url')
  String get url;

  ImportSpotifyPlaylistRequest._();

  factory ImportSpotifyPlaylistRequest([void updates(ImportSpotifyPlaylistRequestBuilder b)]) = _$ImportSpotifyPlaylistRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportSpotifyPlaylistRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportSpotifyPlaylistRequest> get serializer => _$ImportSpotifyPlaylistRequestSerializer();
}

class _$ImportSpotifyPlaylistRequestSerializer implements PrimitiveSerializer<ImportSpotifyPlaylistRequest> {
  @override
  final Iterable<Type> types = const [ImportSpotifyPlaylistRequest, _$ImportSpotifyPlaylistRequest];

  @override
  final String wireName = r'ImportSpotifyPlaylistRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportSpotifyPlaylistRequest object, {
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
    ImportSpotifyPlaylistRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ImportSpotifyPlaylistRequestBuilder result,
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
  ImportSpotifyPlaylistRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportSpotifyPlaylistRequestBuilder();
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


