//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/logged_envelope_data.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'logged_envelope.g.dart';

/// LoggedEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class LoggedEnvelope implements Built<LoggedEnvelope, LoggedEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  LoggedEnvelopeData get data;

  LoggedEnvelope._();

  factory LoggedEnvelope([void updates(LoggedEnvelopeBuilder b)]) = _$LoggedEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoggedEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoggedEnvelope> get serializer => _$LoggedEnvelopeSerializer();
}

class _$LoggedEnvelopeSerializer implements PrimitiveSerializer<LoggedEnvelope> {
  @override
  final Iterable<Type> types = const [LoggedEnvelope, _$LoggedEnvelope];

  @override
  final String wireName = r'LoggedEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoggedEnvelope object, {
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
      specifiedType: const FullType(LoggedEnvelopeData),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoggedEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LoggedEnvelopeBuilder result,
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
            specifiedType: const FullType(LoggedEnvelopeData),
          ) as LoggedEnvelopeData;
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
  LoggedEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoggedEnvelopeBuilder();
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


