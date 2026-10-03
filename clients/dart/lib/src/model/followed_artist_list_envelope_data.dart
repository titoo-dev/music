//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/followed_artist.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'followed_artist_list_envelope_data.g.dart';

/// FollowedArtistListEnvelopeData
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class FollowedArtistListEnvelopeData implements Built<FollowedArtistListEnvelopeData, FollowedArtistListEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<FollowedArtist> get items;

  FollowedArtistListEnvelopeData._();

  factory FollowedArtistListEnvelopeData([void updates(FollowedArtistListEnvelopeDataBuilder b)]) = _$FollowedArtistListEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowedArtistListEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowedArtistListEnvelopeData> get serializer => _$FollowedArtistListEnvelopeDataSerializer();
}

class _$FollowedArtistListEnvelopeDataSerializer implements PrimitiveSerializer<FollowedArtistListEnvelopeData> {
  @override
  final Iterable<Type> types = const [FollowedArtistListEnvelopeData, _$FollowedArtistListEnvelopeData];

  @override
  final String wireName = r'FollowedArtistListEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowedArtistListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(FollowedArtist)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowedArtistListEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowedArtistListEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(FollowedArtist)]),
          ) as BuiltList<FollowedArtist>;
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
  FollowedArtistListEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowedArtistListEnvelopeDataBuilder();
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


