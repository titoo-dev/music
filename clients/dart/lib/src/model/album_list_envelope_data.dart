//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/album.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_list_envelope_data.g.dart';

/// AlbumListEnvelopeData
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class AlbumListEnvelopeData implements Built<AlbumListEnvelopeData, AlbumListEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<Album> get items;

  AlbumListEnvelopeData._();

  factory AlbumListEnvelopeData([void updates(AlbumListEnvelopeDataBuilder b)]) = _$AlbumListEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumListEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumListEnvelopeData> get serializer => _$AlbumListEnvelopeDataSerializer();
}

class _$AlbumListEnvelopeDataSerializer implements PrimitiveSerializer<AlbumListEnvelopeData> {
  @override
  final Iterable<Type> types = const [AlbumListEnvelopeData, _$AlbumListEnvelopeData];

  @override
  final String wireName = r'AlbumListEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(Album)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumListEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Album)]),
          ) as BuiltList<Album>;
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
  AlbumListEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumListEnvelopeDataBuilder();
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


