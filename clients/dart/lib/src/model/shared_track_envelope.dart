//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/shared_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_track_envelope.g.dart';

/// SharedTrackEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SharedTrackEnvelope implements Built<SharedTrackEnvelope, SharedTrackEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SharedTrack get data;

  SharedTrackEnvelope._();

  factory SharedTrackEnvelope([void updates(SharedTrackEnvelopeBuilder b)]) = _$SharedTrackEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SharedTrackEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SharedTrackEnvelope> get serializer => _$SharedTrackEnvelopeSerializer();
}

class _$SharedTrackEnvelopeSerializer implements PrimitiveSerializer<SharedTrackEnvelope> {
  @override
  final Iterable<Type> types = const [SharedTrackEnvelope, _$SharedTrackEnvelope];

  @override
  final String wireName = r'SharedTrackEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SharedTrackEnvelope object, {
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
      specifiedType: const FullType(SharedTrack),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SharedTrackEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SharedTrackEnvelopeBuilder result,
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
            specifiedType: const FullType(SharedTrack),
          ) as SharedTrack;
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
  SharedTrackEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SharedTrackEnvelopeBuilder();
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


