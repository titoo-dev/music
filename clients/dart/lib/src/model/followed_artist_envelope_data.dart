//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/followed_artist.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'followed_artist_envelope_data.g.dart';

/// FollowedArtistEnvelopeData
///
/// Properties:
/// * [followed] 
@BuiltValue()
abstract class FollowedArtistEnvelopeData implements Built<FollowedArtistEnvelopeData, FollowedArtistEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'followed')
  FollowedArtist get followed;

  FollowedArtistEnvelopeData._();

  factory FollowedArtistEnvelopeData([void updates(FollowedArtistEnvelopeDataBuilder b)]) = _$FollowedArtistEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowedArtistEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowedArtistEnvelopeData> get serializer => _$FollowedArtistEnvelopeDataSerializer();
}

class _$FollowedArtistEnvelopeDataSerializer implements PrimitiveSerializer<FollowedArtistEnvelopeData> {
  @override
  final Iterable<Type> types = const [FollowedArtistEnvelopeData, _$FollowedArtistEnvelopeData];

  @override
  final String wireName = r'FollowedArtistEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowedArtistEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'followed';
    yield serializers.serialize(
      object.followed,
      specifiedType: const FullType(FollowedArtist),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowedArtistEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowedArtistEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'followed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(FollowedArtist),
          ) as FollowedArtist;
          result.followed.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FollowedArtistEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowedArtistEnvelopeDataBuilder();
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


