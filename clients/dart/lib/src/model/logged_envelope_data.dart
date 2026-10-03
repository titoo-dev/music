//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'logged_envelope_data.g.dart';

/// LoggedEnvelopeData
///
/// Properties:
/// * [logged] 
@BuiltValue()
abstract class LoggedEnvelopeData implements Built<LoggedEnvelopeData, LoggedEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'logged')
  bool get logged;

  LoggedEnvelopeData._();

  factory LoggedEnvelopeData([void updates(LoggedEnvelopeDataBuilder b)]) = _$LoggedEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoggedEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoggedEnvelopeData> get serializer => _$LoggedEnvelopeDataSerializer();
}

class _$LoggedEnvelopeDataSerializer implements PrimitiveSerializer<LoggedEnvelopeData> {
  @override
  final Iterable<Type> types = const [LoggedEnvelopeData, _$LoggedEnvelopeData];

  @override
  final String wireName = r'LoggedEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoggedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'logged';
    yield serializers.serialize(
      object.logged,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoggedEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LoggedEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'logged':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.logged = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LoggedEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoggedEnvelopeDataBuilder();
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


