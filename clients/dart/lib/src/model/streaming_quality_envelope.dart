//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/set_streaming_quality_request.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'streaming_quality_envelope.g.dart';

/// StreamingQualityEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class StreamingQualityEnvelope implements Built<StreamingQualityEnvelope, StreamingQualityEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SetStreamingQualityRequest get data;

  StreamingQualityEnvelope._();

  factory StreamingQualityEnvelope([void updates(StreamingQualityEnvelopeBuilder b)]) = _$StreamingQualityEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StreamingQualityEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StreamingQualityEnvelope> get serializer => _$StreamingQualityEnvelopeSerializer();
}

class _$StreamingQualityEnvelopeSerializer implements PrimitiveSerializer<StreamingQualityEnvelope> {
  @override
  final Iterable<Type> types = const [StreamingQualityEnvelope, _$StreamingQualityEnvelope];

  @override
  final String wireName = r'StreamingQualityEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StreamingQualityEnvelope object, {
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
      specifiedType: const FullType(SetStreamingQualityRequest),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StreamingQualityEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StreamingQualityEnvelopeBuilder result,
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
            specifiedType: const FullType(SetStreamingQualityRequest),
          ) as SetStreamingQualityRequest;
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
  StreamingQualityEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StreamingQualityEnvelopeBuilder();
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


