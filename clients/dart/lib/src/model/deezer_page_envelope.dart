//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_page_envelope.g.dart';

/// DeezerPageEnvelope
///
/// Properties:
/// * [success] 
/// * [data] - Raw Deezer GW page payload (`gw.get_page`). Contains `sections[]` with `items[]`.
@BuiltValue()
abstract class DeezerPageEnvelope implements Built<DeezerPageEnvelope, DeezerPageEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  /// Raw Deezer GW page payload (`gw.get_page`). Contains `sections[]` with `items[]`.
  @BuiltValueField(wireName: r'data')
  BuiltMap<String, JsonObject?> get data;

  DeezerPageEnvelope._();

  factory DeezerPageEnvelope([void updates(DeezerPageEnvelopeBuilder b)]) = _$DeezerPageEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerPageEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerPageEnvelope> get serializer => _$DeezerPageEnvelopeSerializer();
}

class _$DeezerPageEnvelopeSerializer implements PrimitiveSerializer<DeezerPageEnvelope> {
  @override
  final Iterable<Type> types = const [DeezerPageEnvelope, _$DeezerPageEnvelope];

  @override
  final String wireName = r'DeezerPageEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerPageEnvelope object, {
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
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerPageEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerPageEnvelopeBuilder result,
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
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
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
  DeezerPageEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerPageEnvelopeBuilder();
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


