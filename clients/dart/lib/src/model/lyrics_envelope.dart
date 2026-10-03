//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/lyrics.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lyrics_envelope.g.dart';

/// LyricsEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class LyricsEnvelope implements Built<LyricsEnvelope, LyricsEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  Lyrics get data;

  LyricsEnvelope._();

  factory LyricsEnvelope([void updates(LyricsEnvelopeBuilder b)]) = _$LyricsEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LyricsEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LyricsEnvelope> get serializer => _$LyricsEnvelopeSerializer();
}

class _$LyricsEnvelopeSerializer implements PrimitiveSerializer<LyricsEnvelope> {
  @override
  final Iterable<Type> types = const [LyricsEnvelope, _$LyricsEnvelope];

  @override
  final String wireName = r'LyricsEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LyricsEnvelope object, {
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
      specifiedType: const FullType(Lyrics),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LyricsEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LyricsEnvelopeBuilder result,
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
            specifiedType: const FullType(Lyrics),
          ) as Lyrics;
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
  LyricsEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LyricsEnvelopeBuilder();
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


