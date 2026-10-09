//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_track_batch.g.dart';

/// SpotifyTrackBatch
///
/// Properties:
/// * [tracks] 
/// * [failed] - ids Spotify did not return (removed, region-locked)
/// * [rateLimited] - ids not read because Spotify started refusing — retry after a pause
@BuiltValue()
abstract class SpotifyTrackBatch implements Built<SpotifyTrackBatch, SpotifyTrackBatchBuilder> {
  @BuiltValueField(wireName: r'tracks')
  BuiltList<SpotifyTrack> get tracks;

  /// ids Spotify did not return (removed, region-locked)
  @BuiltValueField(wireName: r'failed')
  BuiltList<String> get failed;

  /// ids not read because Spotify started refusing — retry after a pause
  @BuiltValueField(wireName: r'rateLimited')
  BuiltList<String> get rateLimited;

  SpotifyTrackBatch._();

  factory SpotifyTrackBatch([void updates(SpotifyTrackBatchBuilder b)]) = _$SpotifyTrackBatch;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyTrackBatchBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyTrackBatch> get serializer => _$SpotifyTrackBatchSerializer();
}

class _$SpotifyTrackBatchSerializer implements PrimitiveSerializer<SpotifyTrackBatch> {
  @override
  final Iterable<Type> types = const [SpotifyTrackBatch, _$SpotifyTrackBatch];

  @override
  final String wireName = r'SpotifyTrackBatch';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyTrackBatch object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
    );
    yield r'failed';
    yield serializers.serialize(
      object.failed,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'rateLimited';
    yield serializers.serialize(
      object.rateLimited,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyTrackBatch object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyTrackBatchBuilder result,
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
        case r'failed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.failed.replace(valueDes);
          break;
        case r'rateLimited':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.rateLimited.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyTrackBatch deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyTrackBatchBuilder();
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


