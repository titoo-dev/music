//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_import_result.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_import_envelope.g.dart';

/// SpotifyImportEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SpotifyImportEnvelope implements Built<SpotifyImportEnvelope, SpotifyImportEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SpotifyImportResult get data;

  SpotifyImportEnvelope._();

  factory SpotifyImportEnvelope([void updates(SpotifyImportEnvelopeBuilder b)]) = _$SpotifyImportEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyImportEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyImportEnvelope> get serializer => _$SpotifyImportEnvelopeSerializer();
}

class _$SpotifyImportEnvelopeSerializer implements PrimitiveSerializer<SpotifyImportEnvelope> {
  @override
  final Iterable<Type> types = const [SpotifyImportEnvelope, _$SpotifyImportEnvelope];

  @override
  final String wireName = r'SpotifyImportEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyImportEnvelope object, {
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
      specifiedType: const FullType(SpotifyImportResult),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyImportEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyImportEnvelopeBuilder result,
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
            specifiedType: const FullType(SpotifyImportResult),
          ) as SpotifyImportResult;
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
  SpotifyImportEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyImportEnvelopeBuilder();
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


