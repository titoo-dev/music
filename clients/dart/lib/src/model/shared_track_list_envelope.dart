//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/shared_track.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_track_list_envelope.g.dart';

/// SharedTrackListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SharedTrackListEnvelope implements Built<SharedTrackListEnvelope, SharedTrackListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  BuiltList<SharedTrack> get data;

  SharedTrackListEnvelope._();

  factory SharedTrackListEnvelope([void updates(SharedTrackListEnvelopeBuilder b)]) = _$SharedTrackListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SharedTrackListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SharedTrackListEnvelope> get serializer => _$SharedTrackListEnvelopeSerializer();
}

class _$SharedTrackListEnvelopeSerializer implements PrimitiveSerializer<SharedTrackListEnvelope> {
  @override
  final Iterable<Type> types = const [SharedTrackListEnvelope, _$SharedTrackListEnvelope];

  @override
  final String wireName = r'SharedTrackListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SharedTrackListEnvelope object, {
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
      specifiedType: const FullType(BuiltList, [FullType(SharedTrack)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SharedTrackListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SharedTrackListEnvelopeBuilder result,
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
            specifiedType: const FullType(BuiltList, [FullType(SharedTrack)]),
          ) as BuiltList<SharedTrack>;
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
  SharedTrackListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SharedTrackListEnvelopeBuilder();
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


