//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/skip_result.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'skip_envelope.g.dart';

/// SkipEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SkipEnvelope implements Built<SkipEnvelope, SkipEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SkipResult get data;

  SkipEnvelope._();

  factory SkipEnvelope([void updates(SkipEnvelopeBuilder b)]) = _$SkipEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SkipEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SkipEnvelope> get serializer => _$SkipEnvelopeSerializer();
}

class _$SkipEnvelopeSerializer implements PrimitiveSerializer<SkipEnvelope> {
  @override
  final Iterable<Type> types = const [SkipEnvelope, _$SkipEnvelope];

  @override
  final String wireName = r'SkipEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SkipEnvelope object, {
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
      specifiedType: const FullType(SkipResult),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SkipEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SkipEnvelopeBuilder result,
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
            specifiedType: const FullType(SkipResult),
          ) as SkipResult;
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
  SkipEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SkipEnvelopeBuilder();
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


