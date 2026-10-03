//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/playlist_track_input.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'add_playlist_tracks_request.g.dart';

/// AddPlaylistTracksRequest
///
/// Properties:
/// * [tracks] 
@BuiltValue()
abstract class AddPlaylistTracksRequest implements Built<AddPlaylistTracksRequest, AddPlaylistTracksRequestBuilder> {
  @BuiltValueField(wireName: r'tracks')
  BuiltList<PlaylistTrackInput> get tracks;

  AddPlaylistTracksRequest._();

  factory AddPlaylistTracksRequest([void updates(AddPlaylistTracksRequestBuilder b)]) = _$AddPlaylistTracksRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AddPlaylistTracksRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AddPlaylistTracksRequest> get serializer => _$AddPlaylistTracksRequestSerializer();
}

class _$AddPlaylistTracksRequestSerializer implements PrimitiveSerializer<AddPlaylistTracksRequest> {
  @override
  final Iterable<Type> types = const [AddPlaylistTracksRequest, _$AddPlaylistTracksRequest];

  @override
  final String wireName = r'AddPlaylistTracksRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AddPlaylistTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(PlaylistTrackInput)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AddPlaylistTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AddPlaylistTracksRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(PlaylistTrackInput)]),
          ) as BuiltList<PlaylistTrackInput>;
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
  AddPlaylistTracksRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AddPlaylistTracksRequestBuilder();
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


