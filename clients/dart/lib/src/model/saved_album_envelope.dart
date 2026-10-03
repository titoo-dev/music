//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/saved_album_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_album_envelope.g.dart';

/// SavedAlbumEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SavedAlbumEnvelope implements Built<SavedAlbumEnvelope, SavedAlbumEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SavedAlbumEnvelopeData get data;

  SavedAlbumEnvelope._();

  factory SavedAlbumEnvelope([void updates(SavedAlbumEnvelopeBuilder b)]) = _$SavedAlbumEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedAlbumEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedAlbumEnvelope> get serializer => _$SavedAlbumEnvelopeSerializer();
}

class _$SavedAlbumEnvelopeSerializer implements PrimitiveSerializer<SavedAlbumEnvelope> {
  @override
  final Iterable<Type> types = const [SavedAlbumEnvelope, _$SavedAlbumEnvelope];

  @override
  final String wireName = r'SavedAlbumEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedAlbumEnvelope object, {
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
      specifiedType: const FullType(SavedAlbumEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedAlbumEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedAlbumEnvelopeBuilder result,
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
            specifiedType: const FullType(SavedAlbumEnvelopeData),
          ) as SavedAlbumEnvelopeData;
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
  SavedAlbumEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedAlbumEnvelopeBuilder();
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


