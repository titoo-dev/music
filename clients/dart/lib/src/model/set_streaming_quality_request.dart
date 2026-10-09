//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_streaming_quality_request.g.dart';

/// SetStreamingQualityRequest
///
/// Properties:
/// * [maxBitrate] 
@BuiltValue()
abstract class SetStreamingQualityRequest implements Built<SetStreamingQualityRequest, SetStreamingQualityRequestBuilder> {
  @BuiltValueField(wireName: r'maxBitrate')
  SetStreamingQualityRequestMaxBitrateEnum get maxBitrate;
  // enum maxBitrateEnum {  1,  3,  9,  };

  SetStreamingQualityRequest._();

  factory SetStreamingQualityRequest([void updates(SetStreamingQualityRequestBuilder b)]) = _$SetStreamingQualityRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetStreamingQualityRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetStreamingQualityRequest> get serializer => _$SetStreamingQualityRequestSerializer();
}

class _$SetStreamingQualityRequestSerializer implements PrimitiveSerializer<SetStreamingQualityRequest> {
  @override
  final Iterable<Type> types = const [SetStreamingQualityRequest, _$SetStreamingQualityRequest];

  @override
  final String wireName = r'SetStreamingQualityRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SetStreamingQualityRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'maxBitrate';
    yield serializers.serialize(
      object.maxBitrate,
      specifiedType: const FullType(SetStreamingQualityRequestMaxBitrateEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SetStreamingQualityRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SetStreamingQualityRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'maxBitrate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SetStreamingQualityRequestMaxBitrateEnum),
          ) as SetStreamingQualityRequestMaxBitrateEnum;
          result.maxBitrate = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SetStreamingQualityRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SetStreamingQualityRequestBuilder();
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


class SetStreamingQualityRequestMaxBitrateEnum extends EnumClass {

  @BuiltValueEnumConst(wireNumber: 1)
  static const SetStreamingQualityRequestMaxBitrateEnum number1 = _$setStreamingQualityRequestMaxBitrateEnum_number1;
  @BuiltValueEnumConst(wireNumber: 3)
  static const SetStreamingQualityRequestMaxBitrateEnum number3 = _$setStreamingQualityRequestMaxBitrateEnum_number3;
  @BuiltValueEnumConst(wireNumber: 9)
  static const SetStreamingQualityRequestMaxBitrateEnum number9 = _$setStreamingQualityRequestMaxBitrateEnum_number9;

  static Serializer<SetStreamingQualityRequestMaxBitrateEnum> get serializer => _$setStreamingQualityRequestMaxBitrateEnumSerializer;

  const SetStreamingQualityRequestMaxBitrateEnum._(String name): super(name);

  static BuiltSet<SetStreamingQualityRequestMaxBitrateEnum> get values => _$setStreamingQualityRequestMaxBitrateEnumValues;
  static SetStreamingQualityRequestMaxBitrateEnum valueOf(String name) => _$setStreamingQualityRequestMaxBitrateEnumValueOf(name);
}

