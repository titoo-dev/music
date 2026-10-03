//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/album.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_album_envelope_data.g.dart';

/// SavedAlbumEnvelopeData
///
/// Properties:
/// * [saved] 
@BuiltValue()
abstract class SavedAlbumEnvelopeData implements Built<SavedAlbumEnvelopeData, SavedAlbumEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'saved')
  Album get saved;

  SavedAlbumEnvelopeData._();

  factory SavedAlbumEnvelopeData([void updates(SavedAlbumEnvelopeDataBuilder b)]) = _$SavedAlbumEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedAlbumEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedAlbumEnvelopeData> get serializer => _$SavedAlbumEnvelopeDataSerializer();
}

class _$SavedAlbumEnvelopeDataSerializer implements PrimitiveSerializer<SavedAlbumEnvelopeData> {
  @override
  final Iterable<Type> types = const [SavedAlbumEnvelopeData, _$SavedAlbumEnvelopeData];

  @override
  final String wireName = r'SavedAlbumEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedAlbumEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'saved';
    yield serializers.serialize(
      object.saved,
      specifiedType: const FullType(Album),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedAlbumEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedAlbumEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'saved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Album),
          ) as Album;
          result.saved = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SavedAlbumEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedAlbumEnvelopeDataBuilder();
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


