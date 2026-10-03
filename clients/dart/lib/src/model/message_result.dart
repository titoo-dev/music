//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'message_result.g.dart';

/// MessageResult
///
/// Properties:
/// * [message] 
@BuiltValue()
abstract class MessageResult implements Built<MessageResult, MessageResultBuilder> {
  @BuiltValueField(wireName: r'message')
  String get message;

  MessageResult._();

  factory MessageResult([void updates(MessageResultBuilder b)]) = _$MessageResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MessageResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MessageResult> get serializer => _$MessageResultSerializer();
}

class _$MessageResultSerializer implements PrimitiveSerializer<MessageResult> {
  @override
  final Iterable<Type> types = const [MessageResult, _$MessageResult];

  @override
  final String wireName = r'MessageResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MessageResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MessageResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MessageResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MessageResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MessageResultBuilder();
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


