//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_match_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_match_envelope.g.dart';

/// SpotifyMatchEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SpotifyMatchEnvelope implements Built<SpotifyMatchEnvelope, SpotifyMatchEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SpotifyMatchEnvelopeData get data;

  SpotifyMatchEnvelope._();

  factory SpotifyMatchEnvelope([void updates(SpotifyMatchEnvelopeBuilder b)]) = _$SpotifyMatchEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyMatchEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyMatchEnvelope> get serializer => _$SpotifyMatchEnvelopeSerializer();
}

class _$SpotifyMatchEnvelopeSerializer implements PrimitiveSerializer<SpotifyMatchEnvelope> {
  @override
  final Iterable<Type> types = const [SpotifyMatchEnvelope, _$SpotifyMatchEnvelope];

  @override
  final String wireName = r'SpotifyMatchEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyMatchEnvelope object, {
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
      specifiedType: const FullType(SpotifyMatchEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyMatchEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyMatchEnvelopeBuilder result,
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
            specifiedType: const FullType(SpotifyMatchEnvelopeData),
          ) as SpotifyMatchEnvelopeData;
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
  SpotifyMatchEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyMatchEnvelopeBuilder();
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


