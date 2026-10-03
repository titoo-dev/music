//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'unfollowed_envelope_data.g.dart';

/// UnfollowedEnvelopeData
///
/// Properties:
/// * [unfollowed] 
@BuiltValue()
abstract class UnfollowedEnvelopeData implements Built<UnfollowedEnvelopeData, UnfollowedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'unfollowed')
  bool get unfollowed;

  UnfollowedEnvelopeData._();

  factory UnfollowedEnvelopeData([void updates(UnfollowedEnvelopeDataBuilder b)]) = _$UnfollowedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UnfollowedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UnfollowedEnvelopeData> get serializer => _$UnfollowedEnvelopeDataSerializer();
}

class _$UnfollowedEnvelopeDataSerializer implements PrimitiveSerializer<UnfollowedEnvelopeData> {
  @override
  final Iterable<Type> types = const [UnfollowedEnvelopeData, _$UnfollowedEnvelopeData];

  @override
  final String wireName = r'UnfollowedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UnfollowedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'unfollowed';
    yield serializers.serialize(
      object.unfollowed,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UnfollowedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UnfollowedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'unfollowed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.unfollowed = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UnfollowedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UnfollowedEnvelopeDataBuilder();
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


