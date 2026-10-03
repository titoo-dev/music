//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/followed_artist_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'followed_artist_envelope.g.dart';

/// FollowedArtistEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class FollowedArtistEnvelope implements Built<FollowedArtistEnvelope, FollowedArtistEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  FollowedArtistEnvelopeData get data;

  FollowedArtistEnvelope._();

  factory FollowedArtistEnvelope([void updates(FollowedArtistEnvelopeBuilder b)]) = _$FollowedArtistEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowedArtistEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowedArtistEnvelope> get serializer => _$FollowedArtistEnvelopeSerializer();
}

class _$FollowedArtistEnvelopeSerializer implements PrimitiveSerializer<FollowedArtistEnvelope> {
  @override
  final Iterable<Type> types = const [FollowedArtistEnvelope, _$FollowedArtistEnvelope];

  @override
  final String wireName = r'FollowedArtistEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowedArtistEnvelope object, {
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
      specifiedType: const FullType(FollowedArtistEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowedArtistEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowedArtistEnvelopeBuilder result,
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
            specifiedType: const FullType(FollowedArtistEnvelopeData),
          ) as FollowedArtistEnvelopeData;
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
  FollowedArtistEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowedArtistEnvelopeBuilder();
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


