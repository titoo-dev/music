//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'match_spotify_tracks_request.g.dart';

/// MatchSpotifyTracksRequest
///
/// Properties:
/// * [tracks] 
@BuiltValue()
abstract class MatchSpotifyTracksRequest implements Built<MatchSpotifyTracksRequest, MatchSpotifyTracksRequestBuilder> {
  @BuiltValueField(wireName: r'tracks')
  BuiltList<SpotifyTrack> get tracks;

  MatchSpotifyTracksRequest._();

  factory MatchSpotifyTracksRequest([void updates(MatchSpotifyTracksRequestBuilder b)]) = _$MatchSpotifyTracksRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MatchSpotifyTracksRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MatchSpotifyTracksRequest> get serializer => _$MatchSpotifyTracksRequestSerializer();
}

class _$MatchSpotifyTracksRequestSerializer implements PrimitiveSerializer<MatchSpotifyTracksRequest> {
  @override
  final Iterable<Type> types = const [MatchSpotifyTracksRequest, _$MatchSpotifyTracksRequest];

  @override
  final String wireName = r'MatchSpotifyTracksRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MatchSpotifyTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MatchSpotifyTracksRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MatchSpotifyTracksRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
          ) as BuiltList<SpotifyTrack>;
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
  MatchSpotifyTracksRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MatchSpotifyTracksRequestBuilder();
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


