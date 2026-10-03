//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/saved_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_track_envelope_data.g.dart';

/// SavedTrackEnvelopeData
///
/// Properties:
/// * [saved] 
@BuiltValue()
abstract class SavedTrackEnvelopeData implements Built<SavedTrackEnvelopeData, SavedTrackEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'saved')
  SavedTrack get saved;

  SavedTrackEnvelopeData._();

  factory SavedTrackEnvelopeData([void updates(SavedTrackEnvelopeDataBuilder b)]) = _$SavedTrackEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedTrackEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedTrackEnvelopeData> get serializer => _$SavedTrackEnvelopeDataSerializer();
}

class _$SavedTrackEnvelopeDataSerializer implements PrimitiveSerializer<SavedTrackEnvelopeData> {
  @override
  final Iterable<Type> types = const [SavedTrackEnvelopeData, _$SavedTrackEnvelopeData];

  @override
  final String wireName = r'SavedTrackEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedTrackEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'saved';
    yield serializers.serialize(
      object.saved,
      specifiedType: const FullType(SavedTrack),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedTrackEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedTrackEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'saved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedTrack),
          ) as SavedTrack;
          result.saved.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SavedTrackEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedTrackEnvelopeDataBuilder();
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


