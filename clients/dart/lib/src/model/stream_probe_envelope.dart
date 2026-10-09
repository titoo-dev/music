//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/stream_probe.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stream_probe_envelope.g.dart';

/// StreamProbeEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class StreamProbeEnvelope implements Built<StreamProbeEnvelope, StreamProbeEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  StreamProbe get data;

  StreamProbeEnvelope._();

  factory StreamProbeEnvelope([void updates(StreamProbeEnvelopeBuilder b)]) = _$StreamProbeEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StreamProbeEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StreamProbeEnvelope> get serializer => _$StreamProbeEnvelopeSerializer();
}

class _$StreamProbeEnvelopeSerializer implements PrimitiveSerializer<StreamProbeEnvelope> {
  @override
  final Iterable<Type> types = const [StreamProbeEnvelope, _$StreamProbeEnvelope];

  @override
  final String wireName = r'StreamProbeEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StreamProbeEnvelope object, {
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
      specifiedType: const FullType(StreamProbe),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StreamProbeEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StreamProbeEnvelopeBuilder result,
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
            specifiedType: const FullType(StreamProbe),
          ) as StreamProbe;
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
  StreamProbeEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StreamProbeEnvelopeBuilder();
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


