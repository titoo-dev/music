//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/unfollowed_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'unfollowed_envelope.g.dart';

/// UnfollowedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class UnfollowedEnvelope implements Built<UnfollowedEnvelope, UnfollowedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  UnfollowedEnvelopeData get data;

  UnfollowedEnvelope._();

  factory UnfollowedEnvelope([void updates(UnfollowedEnvelopeBuilder b)]) = _$UnfollowedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UnfollowedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UnfollowedEnvelope> get serializer => _$UnfollowedEnvelopeSerializer();
}

class _$UnfollowedEnvelopeSerializer implements PrimitiveSerializer<UnfollowedEnvelope> {
  @override
  final Iterable<Type> types = const [UnfollowedEnvelope, _$UnfollowedEnvelope];

  @override
  final String wireName = r'UnfollowedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UnfollowedEnvelope object, {
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
      specifiedType: const FullType(UnfollowedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UnfollowedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UnfollowedEnvelopeBuilder result,
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
            specifiedType: const FullType(UnfollowedEnvelopeData),
          ) as UnfollowedEnvelopeData;
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
  UnfollowedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UnfollowedEnvelopeBuilder();
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


