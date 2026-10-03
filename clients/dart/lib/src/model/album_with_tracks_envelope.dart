//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/album_with_tracks.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_with_tracks_envelope.g.dart';

/// AlbumWithTracksEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class AlbumWithTracksEnvelope implements Built<AlbumWithTracksEnvelope, AlbumWithTracksEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  AlbumWithTracks get data;

  AlbumWithTracksEnvelope._();

  factory AlbumWithTracksEnvelope([void updates(AlbumWithTracksEnvelopeBuilder b)]) = _$AlbumWithTracksEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumWithTracksEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumWithTracksEnvelope> get serializer => _$AlbumWithTracksEnvelopeSerializer();
}

class _$AlbumWithTracksEnvelopeSerializer implements PrimitiveSerializer<AlbumWithTracksEnvelope> {
  @override
  final Iterable<Type> types = const [AlbumWithTracksEnvelope, _$AlbumWithTracksEnvelope];

  @override
  final String wireName = r'AlbumWithTracksEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumWithTracksEnvelope object, {
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
      specifiedType: const FullType(AlbumWithTracks),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumWithTracksEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumWithTracksEnvelopeBuilder result,
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
            specifiedType: const FullType(AlbumWithTracks),
          ) as AlbumWithTracks;
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
  AlbumWithTracksEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumWithTracksEnvelopeBuilder();
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


