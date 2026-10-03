//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'added_envelope_data.g.dart';

/// AddedEnvelopeData
///
/// Properties:
/// * [added] 
@BuiltValue()
abstract class AddedEnvelopeData implements Built<AddedEnvelopeData, AddedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'added')
  int get added;

  AddedEnvelopeData._();

  factory AddedEnvelopeData([void updates(AddedEnvelopeDataBuilder b)]) = _$AddedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AddedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AddedEnvelopeData> get serializer => _$AddedEnvelopeDataSerializer();
}

class _$AddedEnvelopeDataSerializer implements PrimitiveSerializer<AddedEnvelopeData> {
  @override
  final Iterable<Type> types = const [AddedEnvelopeData, _$AddedEnvelopeData];

  @override
  final String wireName = r'AddedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AddedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'added';
    yield serializers.serialize(
      object.added,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AddedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AddedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'added':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.added = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AddedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AddedEnvelopeDataBuilder();
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


