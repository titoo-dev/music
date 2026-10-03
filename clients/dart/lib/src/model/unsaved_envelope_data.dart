//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'unsaved_envelope_data.g.dart';

/// UnsavedEnvelopeData
///
/// Properties:
/// * [unsaved] 
@BuiltValue()
abstract class UnsavedEnvelopeData implements Built<UnsavedEnvelopeData, UnsavedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'unsaved')
  bool get unsaved;

  UnsavedEnvelopeData._();

  factory UnsavedEnvelopeData([void updates(UnsavedEnvelopeDataBuilder b)]) = _$UnsavedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UnsavedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UnsavedEnvelopeData> get serializer => _$UnsavedEnvelopeDataSerializer();
}

class _$UnsavedEnvelopeDataSerializer implements PrimitiveSerializer<UnsavedEnvelopeData> {
  @override
  final Iterable<Type> types = const [UnsavedEnvelopeData, _$UnsavedEnvelopeData];

  @override
  final String wireName = r'UnsavedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UnsavedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'unsaved';
    yield serializers.serialize(
      object.unsaved,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UnsavedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UnsavedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'unsaved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.unsaved = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UnsavedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UnsavedEnvelopeDataBuilder();
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


