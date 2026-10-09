//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stream_probe.g.dart';

/// StreamProbe
///
/// Properties:
/// * [ok] 
/// * [cached] - true when a usable cached copy exists for this listener (a play would 302 to /stream; the object itself is not re-checked in R2). Always false with `live=1`.
@BuiltValue()
abstract class StreamProbe implements Built<StreamProbe, StreamProbeBuilder> {
  @BuiltValueField(wireName: r'ok')
  bool get ok;

  /// true when a usable cached copy exists for this listener (a play would 302 to /stream; the object itself is not re-checked in R2). Always false with `live=1`.
  @BuiltValueField(wireName: r'cached')
  bool get cached;

  StreamProbe._();

  factory StreamProbe([void updates(StreamProbeBuilder b)]) = _$StreamProbe;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StreamProbeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StreamProbe> get serializer => _$StreamProbeSerializer();
}

class _$StreamProbeSerializer implements PrimitiveSerializer<StreamProbe> {
  @override
  final Iterable<Type> types = const [StreamProbe, _$StreamProbe];

  @override
  final String wireName = r'StreamProbe';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StreamProbe object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ok';
    yield serializers.serialize(
      object.ok,
      specifiedType: const FullType(bool),
    );
    yield r'cached';
    yield serializers.serialize(
      object.cached,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StreamProbe object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StreamProbeBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ok':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.ok = valueDes;
          break;
        case r'cached':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.cached = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StreamProbe deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StreamProbeBuilder();
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


