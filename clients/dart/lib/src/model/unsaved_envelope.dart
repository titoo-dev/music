//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/unsaved_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'unsaved_envelope.g.dart';

/// UnsavedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class UnsavedEnvelope implements Built<UnsavedEnvelope, UnsavedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  UnsavedEnvelopeData get data;

  UnsavedEnvelope._();

  factory UnsavedEnvelope([void updates(UnsavedEnvelopeBuilder b)]) = _$UnsavedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UnsavedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UnsavedEnvelope> get serializer => _$UnsavedEnvelopeSerializer();
}

class _$UnsavedEnvelopeSerializer implements PrimitiveSerializer<UnsavedEnvelope> {
  @override
  final Iterable<Type> types = const [UnsavedEnvelope, _$UnsavedEnvelope];

  @override
  final String wireName = r'UnsavedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UnsavedEnvelope object, {
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
      specifiedType: const FullType(UnsavedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UnsavedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UnsavedEnvelopeBuilder result,
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
            specifiedType: const FullType(UnsavedEnvelopeData),
          ) as UnsavedEnvelopeData;
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
  UnsavedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UnsavedEnvelopeBuilder();
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


