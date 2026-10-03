//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_search_main_envelope.g.dart';

/// DeezerSearchMainEnvelope
///
/// Properties:
/// * [success] 
/// * [data] - Merged GW search payload with `TRACK`, `ALBUM`, `ARTIST`, `PLAYLIST`, `TOP_RESULT`, `ORDER`, … Each bucket is `{ data: [], count }`. Items are GW objects (uppercase keys) possibly mixed with public-API objects (lowercase keys) appended for extra coverage.
@BuiltValue()
abstract class DeezerSearchMainEnvelope implements Built<DeezerSearchMainEnvelope, DeezerSearchMainEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  /// Merged GW search payload with `TRACK`, `ALBUM`, `ARTIST`, `PLAYLIST`, `TOP_RESULT`, `ORDER`, … Each bucket is `{ data: [], count }`. Items are GW objects (uppercase keys) possibly mixed with public-API objects (lowercase keys) appended for extra coverage.
  @BuiltValueField(wireName: r'data')
  BuiltMap<String, JsonObject?> get data;

  DeezerSearchMainEnvelope._();

  factory DeezerSearchMainEnvelope([void updates(DeezerSearchMainEnvelopeBuilder b)]) = _$DeezerSearchMainEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerSearchMainEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerSearchMainEnvelope> get serializer => _$DeezerSearchMainEnvelopeSerializer();
}

class _$DeezerSearchMainEnvelopeSerializer implements PrimitiveSerializer<DeezerSearchMainEnvelope> {
  @override
  final Iterable<Type> types = const [DeezerSearchMainEnvelope, _$DeezerSearchMainEnvelope];

  @override
  final String wireName = r'DeezerSearchMainEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerSearchMainEnvelope object, {
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
    DeezerSearchMainEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerSearchMainEnvelopeBuilder result,
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
  DeezerSearchMainEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerSearchMainEnvelopeBuilder();
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


