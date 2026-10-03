//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/saved_track_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_track_envelope.g.dart';

/// SavedTrackEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SavedTrackEnvelope implements Built<SavedTrackEnvelope, SavedTrackEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SavedTrackEnvelopeData get data;

  SavedTrackEnvelope._();

  factory SavedTrackEnvelope([void updates(SavedTrackEnvelopeBuilder b)]) = _$SavedTrackEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedTrackEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedTrackEnvelope> get serializer => _$SavedTrackEnvelopeSerializer();
}

class _$SavedTrackEnvelopeSerializer implements PrimitiveSerializer<SavedTrackEnvelope> {
  @override
  final Iterable<Type> types = const [SavedTrackEnvelope, _$SavedTrackEnvelope];

  @override
  final String wireName = r'SavedTrackEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedTrackEnvelope object, {
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
      specifiedType: const FullType(SavedTrackEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedTrackEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedTrackEnvelopeBuilder result,
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
            specifiedType: const FullType(SavedTrackEnvelopeData),
          ) as SavedTrackEnvelopeData;
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
  SavedTrackEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedTrackEnvelopeBuilder();
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


