//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/message_result.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'message_envelope.g.dart';

/// MessageEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class MessageEnvelope implements Built<MessageEnvelope, MessageEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  MessageResult get data;

  MessageEnvelope._();

  factory MessageEnvelope([void updates(MessageEnvelopeBuilder b)]) = _$MessageEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MessageEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MessageEnvelope> get serializer => _$MessageEnvelopeSerializer();
}

class _$MessageEnvelopeSerializer implements PrimitiveSerializer<MessageEnvelope> {
  @override
  final Iterable<Type> types = const [MessageEnvelope, _$MessageEnvelope];

  @override
  final String wireName = r'MessageEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MessageEnvelope object, {
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
      specifiedType: const FullType(MessageResult),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MessageEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MessageEnvelopeBuilder result,
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
            specifiedType: const FullType(MessageResult),
          ) as MessageResult;
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
  MessageEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MessageEnvelopeBuilder();
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


