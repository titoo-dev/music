//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_match_result.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_match_envelope_data.g.dart';

/// SpotifyMatchEnvelopeData
///
/// Properties:
/// * [results] 
@BuiltValue()
abstract class SpotifyMatchEnvelopeData implements Built<SpotifyMatchEnvelopeData, SpotifyMatchEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'results')
  BuiltList<SpotifyMatchResult> get results;

  SpotifyMatchEnvelopeData._();

  factory SpotifyMatchEnvelopeData([void updates(SpotifyMatchEnvelopeDataBuilder b)]) = _$SpotifyMatchEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyMatchEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyMatchEnvelopeData> get serializer => _$SpotifyMatchEnvelopeDataSerializer();
}

class _$SpotifyMatchEnvelopeDataSerializer implements PrimitiveSerializer<SpotifyMatchEnvelopeData> {
  @override
  final Iterable<Type> types = const [SpotifyMatchEnvelopeData, _$SpotifyMatchEnvelopeData];

  @override
  final String wireName = r'SpotifyMatchEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyMatchEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'results';
    yield serializers.serialize(
      object.results,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyMatchResult)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyMatchEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyMatchEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'results':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SpotifyMatchResult)]),
          ) as BuiltList<SpotifyMatchResult>;
          result.results.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyMatchEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyMatchEnvelopeDataBuilder();
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


