//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/album_list_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_list_envelope.g.dart';

/// AlbumListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class AlbumListEnvelope implements Built<AlbumListEnvelope, AlbumListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  AlbumListEnvelopeData get data;

  AlbumListEnvelope._();

  factory AlbumListEnvelope([void updates(AlbumListEnvelopeBuilder b)]) = _$AlbumListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumListEnvelope> get serializer => _$AlbumListEnvelopeSerializer();
}

class _$AlbumListEnvelopeSerializer implements PrimitiveSerializer<AlbumListEnvelope> {
  @override
  final Iterable<Type> types = const [AlbumListEnvelope, _$AlbumListEnvelope];

  @override
  final String wireName = r'AlbumListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumListEnvelope object, {
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
      specifiedType: const FullType(AlbumListEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumListEnvelopeBuilder result,
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
            specifiedType: const FullType(AlbumListEnvelopeData),
          ) as AlbumListEnvelopeData;
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
  AlbumListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumListEnvelopeBuilder();
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


