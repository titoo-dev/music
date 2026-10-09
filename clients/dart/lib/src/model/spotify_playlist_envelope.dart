//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_playlist.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_playlist_envelope.g.dart';

/// SpotifyPlaylistEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SpotifyPlaylistEnvelope implements Built<SpotifyPlaylistEnvelope, SpotifyPlaylistEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SpotifyPlaylist get data;

  SpotifyPlaylistEnvelope._();

  factory SpotifyPlaylistEnvelope([void updates(SpotifyPlaylistEnvelopeBuilder b)]) = _$SpotifyPlaylistEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyPlaylistEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyPlaylistEnvelope> get serializer => _$SpotifyPlaylistEnvelopeSerializer();
}

class _$SpotifyPlaylistEnvelopeSerializer implements PrimitiveSerializer<SpotifyPlaylistEnvelope> {
  @override
  final Iterable<Type> types = const [SpotifyPlaylistEnvelope, _$SpotifyPlaylistEnvelope];

  @override
  final String wireName = r'SpotifyPlaylistEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyPlaylistEnvelope object, {
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
      specifiedType: const FullType(SpotifyPlaylist),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyPlaylistEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyPlaylistEnvelopeBuilder result,
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
            specifiedType: const FullType(SpotifyPlaylist),
          ) as SpotifyPlaylist;
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
  SpotifyPlaylistEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyPlaylistEnvelopeBuilder();
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


