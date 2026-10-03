//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/public_share.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'public_share_envelope.g.dart';

/// PublicShareEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class PublicShareEnvelope implements Built<PublicShareEnvelope, PublicShareEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  PublicShare get data;

  PublicShareEnvelope._();

  factory PublicShareEnvelope([void updates(PublicShareEnvelopeBuilder b)]) = _$PublicShareEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PublicShareEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PublicShareEnvelope> get serializer => _$PublicShareEnvelopeSerializer();
}

class _$PublicShareEnvelopeSerializer implements PrimitiveSerializer<PublicShareEnvelope> {
  @override
  final Iterable<Type> types = const [PublicShareEnvelope, _$PublicShareEnvelope];

  @override
  final String wireName = r'PublicShareEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PublicShareEnvelope object, {
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
      specifiedType: const FullType(PublicShare),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PublicShareEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PublicShareEnvelopeBuilder result,
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
            specifiedType: const FullType(PublicShare),
          ) as PublicShare;
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
  PublicShareEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PublicShareEnvelopeBuilder();
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


