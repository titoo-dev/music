//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'removed_envelope_data.g.dart';

/// RemovedEnvelopeData
///
/// Properties:
/// * [removed] 
@BuiltValue()
abstract class RemovedEnvelopeData implements Built<RemovedEnvelopeData, RemovedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'removed')
  int get removed;

  RemovedEnvelopeData._();

  factory RemovedEnvelopeData([void updates(RemovedEnvelopeDataBuilder b)]) = _$RemovedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RemovedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RemovedEnvelopeData> get serializer => _$RemovedEnvelopeDataSerializer();
}

class _$RemovedEnvelopeDataSerializer implements PrimitiveSerializer<RemovedEnvelopeData> {
  @override
  final Iterable<Type> types = const [RemovedEnvelopeData, _$RemovedEnvelopeData];

  @override
  final String wireName = r'RemovedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RemovedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'removed';
    yield serializers.serialize(
      object.removed,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RemovedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RemovedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'removed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.removed = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RemovedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RemovedEnvelopeDataBuilder();
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


