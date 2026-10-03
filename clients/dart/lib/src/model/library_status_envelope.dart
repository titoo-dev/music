//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/library_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_status_envelope.g.dart';

/// LibraryStatusEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class LibraryStatusEnvelope implements Built<LibraryStatusEnvelope, LibraryStatusEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  LibraryStatus get data;

  LibraryStatusEnvelope._();

  factory LibraryStatusEnvelope([void updates(LibraryStatusEnvelopeBuilder b)]) = _$LibraryStatusEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryStatusEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryStatusEnvelope> get serializer => _$LibraryStatusEnvelopeSerializer();
}

class _$LibraryStatusEnvelopeSerializer implements PrimitiveSerializer<LibraryStatusEnvelope> {
  @override
  final Iterable<Type> types = const [LibraryStatusEnvelope, _$LibraryStatusEnvelope];

  @override
  final String wireName = r'LibraryStatusEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryStatusEnvelope object, {
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
      specifiedType: const FullType(LibraryStatus),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryStatusEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryStatusEnvelopeBuilder result,
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
            specifiedType: const FullType(LibraryStatus),
          ) as LibraryStatus;
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
  LibraryStatusEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryStatusEnvelopeBuilder();
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


