//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_tracklist_envelope.g.dart';

/// DeezerTracklistEnvelope
///
/// Properties:
/// * [success] 
/// * [data] - Raw Deezer GW payload. `type=album` → album page + `tracks[]`; `type=playlist` → playlist page + `tracks[]`; `type=artist` → artist page + `topTracks[]` + `discography`. GW objects use uppercase keys (SNG_ID, ALB_ID, ART_ID, …).
@BuiltValue()
abstract class DeezerTracklistEnvelope implements Built<DeezerTracklistEnvelope, DeezerTracklistEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  /// Raw Deezer GW payload. `type=album` → album page + `tracks[]`; `type=playlist` → playlist page + `tracks[]`; `type=artist` → artist page + `topTracks[]` + `discography`. GW objects use uppercase keys (SNG_ID, ALB_ID, ART_ID, …).
  @BuiltValueField(wireName: r'data')
  BuiltMap<String, JsonObject?> get data;

  DeezerTracklistEnvelope._();

  factory DeezerTracklistEnvelope([void updates(DeezerTracklistEnvelopeBuilder b)]) = _$DeezerTracklistEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerTracklistEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerTracklistEnvelope> get serializer => _$DeezerTracklistEnvelopeSerializer();
}

class _$DeezerTracklistEnvelopeSerializer implements PrimitiveSerializer<DeezerTracklistEnvelope> {
  @override
  final Iterable<Type> types = const [DeezerTracklistEnvelope, _$DeezerTracklistEnvelope];

  @override
  final String wireName = r'DeezerTracklistEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerTracklistEnvelope object, {
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
    DeezerTracklistEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerTracklistEnvelopeBuilder result,
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
  DeezerTracklistEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerTracklistEnvelopeBuilder();
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


