//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'read_spotify_tracks_request.g.dart';

/// ReadSpotifyTracksRequest
///
/// Properties:
/// * [ids] 
@BuiltValue()
abstract class ReadSpotifyTracksRequest implements Built<ReadSpotifyTracksRequest, ReadSpotifyTracksRequestBuilder> {
  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  ReadSpotifyTracksRequest._();

  factory ReadSpotifyTracksRequest([void updates(ReadSpotifyTracksRequestBuilder b)]) = _$ReadSpotifyTracksRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReadSpotifyTracksRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReadSpotifyTracksRequest> get serializer => _$ReadSpotifyTracksRequestSerializer();
}

class _$ReadSpotifyTracksRequestSerializer implements PrimitiveSerializer<ReadSpotifyTracksRequest> {
  @override
  final Iterable<Type> types = const [ReadSpotifyTracksRequest, _$ReadSpotifyTracksRequest];

  @override
  final String wireName = r'ReadSpotifyTracksRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReadSpotifyTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReadSpotifyTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReadSpotifyTracksRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ids':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.ids.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReadSpotifyTracksRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReadSpotifyTracksRequestBuilder();
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


