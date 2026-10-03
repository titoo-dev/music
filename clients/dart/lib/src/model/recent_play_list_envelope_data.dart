//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/recent_play.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recent_play_list_envelope_data.g.dart';

/// RecentPlayListEnvelopeData
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class RecentPlayListEnvelopeData implements Built<RecentPlayListEnvelopeData, RecentPlayListEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<RecentPlay> get items;

  RecentPlayListEnvelopeData._();

  factory RecentPlayListEnvelopeData([void updates(RecentPlayListEnvelopeDataBuilder b)]) = _$RecentPlayListEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecentPlayListEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecentPlayListEnvelopeData> get serializer => _$RecentPlayListEnvelopeDataSerializer();
}

class _$RecentPlayListEnvelopeDataSerializer implements PrimitiveSerializer<RecentPlayListEnvelopeData> {
  @override
  final Iterable<Type> types = const [RecentPlayListEnvelopeData, _$RecentPlayListEnvelopeData];

  @override
  final String wireName = r'RecentPlayListEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecentPlayListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(RecentPlay)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecentPlayListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecentPlayListEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RecentPlay)]),
          ) as BuiltList<RecentPlay>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecentPlayListEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecentPlayListEnvelopeDataBuilder();
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


