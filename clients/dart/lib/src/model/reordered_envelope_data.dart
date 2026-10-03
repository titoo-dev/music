//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reordered_envelope_data.g.dart';

/// ReorderedEnvelopeData
///
/// Properties:
/// * [reordered] 
@BuiltValue()
abstract class ReorderedEnvelopeData implements Built<ReorderedEnvelopeData, ReorderedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'reordered')
  int get reordered;

  ReorderedEnvelopeData._();

  factory ReorderedEnvelopeData([void updates(ReorderedEnvelopeDataBuilder b)]) = _$ReorderedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReorderedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReorderedEnvelopeData> get serializer => _$ReorderedEnvelopeDataSerializer();
}

class _$ReorderedEnvelopeDataSerializer implements PrimitiveSerializer<ReorderedEnvelopeData> {
  @override
  final Iterable<Type> types = const [ReorderedEnvelopeData, _$ReorderedEnvelopeData];

  @override
  final String wireName = r'ReorderedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReorderedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'reordered';
    yield serializers.serialize(
      object.reordered,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReorderedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReorderedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'reordered':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.reordered = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReorderedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReorderedEnvelopeDataBuilder();
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


