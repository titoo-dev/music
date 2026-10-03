//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/added_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'added_envelope.g.dart';

/// AddedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class AddedEnvelope implements Built<AddedEnvelope, AddedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  AddedEnvelopeData get data;

  AddedEnvelope._();

  factory AddedEnvelope([void updates(AddedEnvelopeBuilder b)]) = _$AddedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AddedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AddedEnvelope> get serializer => _$AddedEnvelopeSerializer();
}

class _$AddedEnvelopeSerializer implements PrimitiveSerializer<AddedEnvelope> {
  @override
  final Iterable<Type> types = const [AddedEnvelope, _$AddedEnvelope];

  @override
  final String wireName = r'AddedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AddedEnvelope object, {
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
      specifiedType: const FullType(AddedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AddedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AddedEnvelopeBuilder result,
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
            specifiedType: const FullType(AddedEnvelopeData),
          ) as AddedEnvelopeData;
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
  AddedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AddedEnvelopeBuilder();
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


