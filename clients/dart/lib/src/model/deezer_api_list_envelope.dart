//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deezer_api_list.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_api_list_envelope.g.dart';

/// DeezerApiListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class DeezerApiListEnvelope implements Built<DeezerApiListEnvelope, DeezerApiListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  DeezerApiList get data;

  DeezerApiListEnvelope._();

  factory DeezerApiListEnvelope([void updates(DeezerApiListEnvelopeBuilder b)]) = _$DeezerApiListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerApiListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerApiListEnvelope> get serializer => _$DeezerApiListEnvelopeSerializer();
}

class _$DeezerApiListEnvelopeSerializer implements PrimitiveSerializer<DeezerApiListEnvelope> {
  @override
  final Iterable<Type> types = const [DeezerApiListEnvelope, _$DeezerApiListEnvelope];

  @override
  final String wireName = r'DeezerApiListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerApiListEnvelope object, {
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
      specifiedType: const FullType(DeezerApiList),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerApiListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerApiListEnvelopeBuilder result,
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
            specifiedType: const FullType(DeezerApiList),
          ) as DeezerApiList;
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
  DeezerApiListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerApiListEnvelopeBuilder();
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


