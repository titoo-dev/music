//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'remove_playlist_tracks_request.g.dart';

/// RemovePlaylistTracksRequest
///
/// Properties:
/// * [trackIds] 
@BuiltValue()
abstract class RemovePlaylistTracksRequest implements Built<RemovePlaylistTracksRequest, RemovePlaylistTracksRequestBuilder> {
  @BuiltValueField(wireName: r'trackIds')
  BuiltList<String> get trackIds;

  RemovePlaylistTracksRequest._();

  factory RemovePlaylistTracksRequest([void updates(RemovePlaylistTracksRequestBuilder b)]) = _$RemovePlaylistTracksRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RemovePlaylistTracksRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RemovePlaylistTracksRequest> get serializer => _$RemovePlaylistTracksRequestSerializer();
}

class _$RemovePlaylistTracksRequestSerializer implements PrimitiveSerializer<RemovePlaylistTracksRequest> {
  @override
  final Iterable<Type> types = const [RemovePlaylistTracksRequest, _$RemovePlaylistTracksRequest];

  @override
  final String wireName = r'RemovePlaylistTracksRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RemovePlaylistTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'trackIds';
    yield serializers.serialize(
      object.trackIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RemovePlaylistTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RemovePlaylistTracksRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'trackIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.trackIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RemovePlaylistTracksRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RemovePlaylistTracksRequestBuilder();
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


