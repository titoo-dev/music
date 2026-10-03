//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/connect_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'connect_status_envelope.g.dart';

/// ConnectStatusEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class ConnectStatusEnvelope implements Built<ConnectStatusEnvelope, ConnectStatusEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  ConnectStatus get data;

  ConnectStatusEnvelope._();

  factory ConnectStatusEnvelope([void updates(ConnectStatusEnvelopeBuilder b)]) = _$ConnectStatusEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConnectStatusEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConnectStatusEnvelope> get serializer => _$ConnectStatusEnvelopeSerializer();
}

class _$ConnectStatusEnvelopeSerializer implements PrimitiveSerializer<ConnectStatusEnvelope> {
  @override
  final Iterable<Type> types = const [ConnectStatusEnvelope, _$ConnectStatusEnvelope];

  @override
  final String wireName = r'ConnectStatusEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConnectStatusEnvelope object, {
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
      specifiedType: const FullType(ConnectStatus),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ConnectStatusEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConnectStatusEnvelopeBuilder result,
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
            specifiedType: const FullType(ConnectStatus),
          ) as ConnectStatus;
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
  ConnectStatusEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConnectStatusEnvelopeBuilder();
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


