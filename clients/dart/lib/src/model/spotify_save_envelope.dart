//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_save_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_save_envelope.g.dart';

/// SpotifySaveEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SpotifySaveEnvelope implements Built<SpotifySaveEnvelope, SpotifySaveEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SpotifySaveEnvelopeData get data;

  SpotifySaveEnvelope._();

  factory SpotifySaveEnvelope([void updates(SpotifySaveEnvelopeBuilder b)]) = _$SpotifySaveEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifySaveEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifySaveEnvelope> get serializer => _$SpotifySaveEnvelopeSerializer();
}

class _$SpotifySaveEnvelopeSerializer implements PrimitiveSerializer<SpotifySaveEnvelope> {
  @override
  final Iterable<Type> types = const [SpotifySaveEnvelope, _$SpotifySaveEnvelope];

  @override
  final String wireName = r'SpotifySaveEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifySaveEnvelope object, {
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
      specifiedType: const FullType(SpotifySaveEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifySaveEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifySaveEnvelopeBuilder result,
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
            specifiedType: const FullType(SpotifySaveEnvelopeData),
          ) as SpotifySaveEnvelopeData;
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
  SpotifySaveEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifySaveEnvelopeBuilder();
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


