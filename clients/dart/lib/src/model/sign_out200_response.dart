//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'sign_out200_response.g.dart';

/// SignOut200Response
///
/// Properties:
/// * [success] 
@BuiltValue()
abstract class SignOut200Response implements Built<SignOut200Response, SignOut200ResponseBuilder> {
  @BuiltValueField(wireName: r'success')
  bool? get success;

  SignOut200Response._();

  factory SignOut200Response([void updates(SignOut200ResponseBuilder b)]) = _$SignOut200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SignOut200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SignOut200Response> get serializer => _$SignOut200ResponseSerializer();
}

class _$SignOut200ResponseSerializer implements PrimitiveSerializer<SignOut200Response> {
  @override
  final Iterable<Type> types = const [SignOut200Response, _$SignOut200Response];

  @override
  final String wireName = r'SignOut200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SignOut200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.success != null) {
      yield r'success';
      yield serializers.serialize(
        object.success,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SignOut200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SignOut200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.success = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SignOut200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SignOut200ResponseBuilder();
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


