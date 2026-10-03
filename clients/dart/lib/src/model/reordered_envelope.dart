//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/reordered_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reordered_envelope.g.dart';

/// ReorderedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class ReorderedEnvelope implements Built<ReorderedEnvelope, ReorderedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  ReorderedEnvelopeData get data;

  ReorderedEnvelope._();

  factory ReorderedEnvelope([void updates(ReorderedEnvelopeBuilder b)]) = _$ReorderedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReorderedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReorderedEnvelope> get serializer => _$ReorderedEnvelopeSerializer();
}

class _$ReorderedEnvelopeSerializer implements PrimitiveSerializer<ReorderedEnvelope> {
  @override
  final Iterable<Type> types = const [ReorderedEnvelope, _$ReorderedEnvelope];

  @override
  final String wireName = r'ReorderedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReorderedEnvelope object, {
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
      specifiedType: const FullType(ReorderedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReorderedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReorderedEnvelopeBuilder result,
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
            specifiedType: const FullType(ReorderedEnvelopeData),
          ) as ReorderedEnvelopeData;
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
  ReorderedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReorderedEnvelopeBuilder();
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


