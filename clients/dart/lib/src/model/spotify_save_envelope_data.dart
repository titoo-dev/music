//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/playlist.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_save_envelope_data.g.dart';

/// SpotifySaveEnvelopeData
///
/// Properties:
/// * [playlist] 
@BuiltValue()
abstract class SpotifySaveEnvelopeData implements Built<SpotifySaveEnvelopeData, SpotifySaveEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'playlist')
  Playlist get playlist;

  SpotifySaveEnvelopeData._();

  factory SpotifySaveEnvelopeData([void updates(SpotifySaveEnvelopeDataBuilder b)]) = _$SpotifySaveEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifySaveEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifySaveEnvelopeData> get serializer => _$SpotifySaveEnvelopeDataSerializer();
}

class _$SpotifySaveEnvelopeDataSerializer implements PrimitiveSerializer<SpotifySaveEnvelopeData> {
  @override
  final Iterable<Type> types = const [SpotifySaveEnvelopeData, _$SpotifySaveEnvelopeData];

  @override
  final String wireName = r'SpotifySaveEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifySaveEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'playlist';
    yield serializers.serialize(
      object.playlist,
      specifiedType: const FullType(Playlist),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifySaveEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifySaveEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'playlist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Playlist),
          ) as Playlist;
          result.playlist = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifySaveEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifySaveEnvelopeDataBuilder();
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


