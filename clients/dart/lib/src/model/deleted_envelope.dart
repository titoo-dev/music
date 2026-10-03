//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deleted_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deleted_envelope.g.dart';

/// DeletedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class DeletedEnvelope implements Built<DeletedEnvelope, DeletedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  DeletedEnvelopeData get data;

  DeletedEnvelope._();

  factory DeletedEnvelope([void updates(DeletedEnvelopeBuilder b)]) = _$DeletedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeletedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeletedEnvelope> get serializer => _$DeletedEnvelopeSerializer();
}

class _$DeletedEnvelopeSerializer implements PrimitiveSerializer<DeletedEnvelope> {
  @override
  final Iterable<Type> types = const [DeletedEnvelope, _$DeletedEnvelope];

  @override
  final String wireName = r'DeletedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeletedEnvelope object, {
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
      specifiedType: const FullType(DeletedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeletedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeletedEnvelopeBuilder result,
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
            specifiedType: const FullType(DeletedEnvelopeData),
          ) as DeletedEnvelopeData;
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
  DeletedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeletedEnvelopeBuilder();
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


