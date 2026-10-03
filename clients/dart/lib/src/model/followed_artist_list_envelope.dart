//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/followed_artist_list_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'followed_artist_list_envelope.g.dart';

/// FollowedArtistListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class FollowedArtistListEnvelope implements Built<FollowedArtistListEnvelope, FollowedArtistListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  FollowedArtistListEnvelopeData get data;

  FollowedArtistListEnvelope._();

  factory FollowedArtistListEnvelope([void updates(FollowedArtistListEnvelopeBuilder b)]) = _$FollowedArtistListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowedArtistListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowedArtistListEnvelope> get serializer => _$FollowedArtistListEnvelopeSerializer();
}

class _$FollowedArtistListEnvelopeSerializer implements PrimitiveSerializer<FollowedArtistListEnvelope> {
  @override
  final Iterable<Type> types = const [FollowedArtistListEnvelope, _$FollowedArtistListEnvelope];

  @override
  final String wireName = r'FollowedArtistListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowedArtistListEnvelope object, {
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
      specifiedType: const FullType(FollowedArtistListEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowedArtistListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowedArtistListEnvelopeBuilder result,
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
            specifiedType: const FullType(FollowedArtistListEnvelopeData),
          ) as FollowedArtistListEnvelopeData;
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
  FollowedArtistListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowedArtistListEnvelopeBuilder();
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


