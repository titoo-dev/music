//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deleted_envelope_data.g.dart';

/// DeletedEnvelopeData
///
/// Properties:
/// * [deleted] 
@BuiltValue()
abstract class DeletedEnvelopeData implements Built<DeletedEnvelopeData, DeletedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'deleted')
  bool get deleted;

  DeletedEnvelopeData._();

  factory DeletedEnvelopeData([void updates(DeletedEnvelopeDataBuilder b)]) = _$DeletedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeletedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeletedEnvelopeData> get serializer => _$DeletedEnvelopeDataSerializer();
}

class _$DeletedEnvelopeDataSerializer implements PrimitiveSerializer<DeletedEnvelopeData> {
  @override
  final Iterable<Type> types = const [DeletedEnvelopeData, _$DeletedEnvelopeData];

  @override
  final String wireName = r'DeletedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeletedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'deleted';
    yield serializers.serialize(
      object.deleted,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeletedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeletedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.deleted = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeletedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeletedEnvelopeDataBuilder();
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


