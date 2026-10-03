//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/recent_play_list_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recent_play_list_envelope.g.dart';

/// RecentPlayListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class RecentPlayListEnvelope implements Built<RecentPlayListEnvelope, RecentPlayListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  RecentPlayListEnvelopeData get data;

  RecentPlayListEnvelope._();

  factory RecentPlayListEnvelope([void updates(RecentPlayListEnvelopeBuilder b)]) = _$RecentPlayListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentPlayListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentPlayListEnvelope> get serializer => _$RecentPlayListEnvelopeSerializer();
}

class _$RecentPlayListEnvelopeSerializer implements PrimitiveSerializer<RecentPlayListEnvelope> {
  @override
  final Iterable<Type> types = const [RecentPlayListEnvelope, _$RecentPlayListEnvelope];

  @override
  final String wireName = r'RecentPlayListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentPlayListEnvelope object, {
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
      specifiedType: const FullType(RecentPlayListEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentPlayListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentPlayListEnvelopeBuilder result,
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
            specifiedType: const FullType(RecentPlayListEnvelopeData),
          ) as RecentPlayListEnvelopeData;
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
  RecentPlayListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentPlayListEnvelopeBuilder();
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


