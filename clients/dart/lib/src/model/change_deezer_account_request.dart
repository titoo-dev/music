//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'change_deezer_account_request.g.dart';

/// ChangeDeezerAccountRequest
///
/// Properties:
/// * [child] - Index in `childs`
@BuiltValue()
abstract class ChangeDeezerAccountRequest implements Built<ChangeDeezerAccountRequest, ChangeDeezerAccountRequestBuilder> {
  /// Index in `childs`
  @BuiltValueField(wireName: r'child')
  int get child;

  ChangeDeezerAccountRequest._();

  factory ChangeDeezerAccountRequest([void updates(ChangeDeezerAccountRequestBuilder b)]) = _$ChangeDeezerAccountRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ChangeDeezerAccountRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ChangeDeezerAccountRequest> get serializer => _$ChangeDeezerAccountRequestSerializer();
}

class _$ChangeDeezerAccountRequestSerializer implements PrimitiveSerializer<ChangeDeezerAccountRequest> {
  @override
  final Iterable<Type> types = const [ChangeDeezerAccountRequest, _$ChangeDeezerAccountRequest];

  @override
  final String wireName = r'ChangeDeezerAccountRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ChangeDeezerAccountRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'child';
    yield serializers.serialize(
      object.child,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ChangeDeezerAccountRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ChangeDeezerAccountRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'child':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.child = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ChangeDeezerAccountRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ChangeDeezerAccountRequestBuilder();
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


