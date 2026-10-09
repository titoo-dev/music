//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_track_batch.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_track_batch_envelope.g.dart';

/// SpotifyTrackBatchEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SpotifyTrackBatchEnvelope implements Built<SpotifyTrackBatchEnvelope, SpotifyTrackBatchEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SpotifyTrackBatch get data;

  SpotifyTrackBatchEnvelope._();

  factory SpotifyTrackBatchEnvelope([void updates(SpotifyTrackBatchEnvelopeBuilder b)]) = _$SpotifyTrackBatchEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyTrackBatchEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyTrackBatchEnvelope> get serializer => _$SpotifyTrackBatchEnvelopeSerializer();
}

class _$SpotifyTrackBatchEnvelopeSerializer implements PrimitiveSerializer<SpotifyTrackBatchEnvelope> {
  @override
  final Iterable<Type> types = const [SpotifyTrackBatchEnvelope, _$SpotifyTrackBatchEnvelope];

  @override
  final String wireName = r'SpotifyTrackBatchEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyTrackBatchEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SpotifyTrackBatch),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyTrackBatchEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyTrackBatchEnvelopeBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SpotifyTrackBatch),
          ) as SpotifyTrackBatch;
          result.data.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyTrackBatchEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyTrackBatchEnvelopeBuilder();
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


