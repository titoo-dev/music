//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/saved_track.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_track_list_envelope_data.g.dart';

/// SavedTrackListEnvelopeData
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class SavedTrackListEnvelopeData implements Built<SavedTrackListEnvelopeData, SavedTrackListEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<SavedTrack> get items;

  SavedTrackListEnvelopeData._();

  factory SavedTrackListEnvelopeData([void updates(SavedTrackListEnvelopeDataBuilder b)]) = _$SavedTrackListEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedTrackListEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedTrackListEnvelopeData> get serializer => _$SavedTrackListEnvelopeDataSerializer();
}

class _$SavedTrackListEnvelopeDataSerializer implements PrimitiveSerializer<SavedTrackListEnvelopeData> {
  @override
  final Iterable<Type> types = const [SavedTrackListEnvelopeData, _$SavedTrackListEnvelopeData];

  @override
  final String wireName = r'SavedTrackListEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedTrackListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(SavedTrack)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedTrackListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedTrackListEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SavedTrack)]),
          ) as BuiltList<SavedTrack>;
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
  SavedTrackListEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedTrackListEnvelopeDataBuilder();
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


