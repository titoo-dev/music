//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/removed_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'removed_envelope.g.dart';

/// RemovedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class RemovedEnvelope implements Built<RemovedEnvelope, RemovedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  RemovedEnvelopeData get data;

  RemovedEnvelope._();

  factory RemovedEnvelope([void updates(RemovedEnvelopeBuilder b)]) = _$RemovedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RemovedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RemovedEnvelope> get serializer => _$RemovedEnvelopeSerializer();
}

class _$RemovedEnvelopeSerializer implements PrimitiveSerializer<RemovedEnvelope> {
  @override
  final Iterable<Type> types = const [RemovedEnvelope, _$RemovedEnvelope];

  @override
  final String wireName = r'RemovedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RemovedEnvelope object, {
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
      specifiedType: const FullType(RemovedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RemovedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RemovedEnvelopeBuilder result,
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
            specifiedType: const FullType(RemovedEnvelopeData),
          ) as RemovedEnvelopeData;
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
  RemovedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RemovedEnvelopeBuilder();
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


