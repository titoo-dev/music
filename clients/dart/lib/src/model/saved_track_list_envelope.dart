//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/saved_track_list_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_track_list_envelope.g.dart';

/// SavedTrackListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SavedTrackListEnvelope implements Built<SavedTrackListEnvelope, SavedTrackListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SavedTrackListEnvelopeData get data;

  SavedTrackListEnvelope._();

  factory SavedTrackListEnvelope([void updates(SavedTrackListEnvelopeBuilder b)]) = _$SavedTrackListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedTrackListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedTrackListEnvelope> get serializer => _$SavedTrackListEnvelopeSerializer();
}

class _$SavedTrackListEnvelopeSerializer implements PrimitiveSerializer<SavedTrackListEnvelope> {
  @override
  final Iterable<Type> types = const [SavedTrackListEnvelope, _$SavedTrackListEnvelope];

  @override
  final String wireName = r'SavedTrackListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedTrackListEnvelope object, {
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
      specifiedType: const FullType(SavedTrackListEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedTrackListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedTrackListEnvelopeBuilder result,
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
            specifiedType: const FullType(SavedTrackListEnvelopeData),
          ) as SavedTrackListEnvelopeData;
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
  SavedTrackListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedTrackListEnvelopeBuilder();
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


