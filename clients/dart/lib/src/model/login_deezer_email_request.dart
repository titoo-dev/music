//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'login_deezer_email_request.g.dart';

/// LoginDeezerEmailRequest
///
/// Properties:
/// * [email] 
/// * [password] 
@BuiltValue()
abstract class LoginDeezerEmailRequest implements Built<LoginDeezerEmailRequest, LoginDeezerEmailRequestBuilder> {
  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'password')
  String get password;

  LoginDeezerEmailRequest._();

  factory LoginDeezerEmailRequest([void updates(LoginDeezerEmailRequestBuilder b)]) = _$LoginDeezerEmailRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoginDeezerEmailRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoginDeezerEmailRequest> get serializer => _$LoginDeezerEmailRequestSerializer();
}

class _$LoginDeezerEmailRequestSerializer implements PrimitiveSerializer<LoginDeezerEmailRequest> {
  @override
  final Iterable<Type> types = const [LoginDeezerEmailRequest, _$LoginDeezerEmailRequest];

  @override
  final String wireName = r'LoginDeezerEmailRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoginDeezerEmailRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LoginDeezerEmailRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LoginDeezerEmailRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LoginDeezerEmailRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoginDeezerEmailRequestBuilder();
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


