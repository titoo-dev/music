//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/suggestions.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suggestions_envelope.g.dart';

/// SuggestionsEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SuggestionsEnvelope implements Built<SuggestionsEnvelope, SuggestionsEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  Suggestions get data;

  SuggestionsEnvelope._();

  factory SuggestionsEnvelope([void updates(SuggestionsEnvelopeBuilder b)]) = _$SuggestionsEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuggestionsEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuggestionsEnvelope> get serializer => _$SuggestionsEnvelopeSerializer();
}

class _$SuggestionsEnvelopeSerializer implements PrimitiveSerializer<SuggestionsEnvelope> {
  @override
  final Iterable<Type> types = const [SuggestionsEnvelope, _$SuggestionsEnvelope];

  @override
  final String wireName = r'SuggestionsEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuggestionsEnvelope object, {
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
      specifiedType: const FullType(Suggestions),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SuggestionsEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuggestionsEnvelopeBuilder result,
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
            specifiedType: const FullType(Suggestions),
          ) as Suggestions;
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
  SuggestionsEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuggestionsEnvelopeBuilder();
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


