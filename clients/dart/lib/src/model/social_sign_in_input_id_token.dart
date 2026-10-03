//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'social_sign_in_input_id_token.g.dart';

/// Native mobile flow: no browser redirect, session cookie set directly on the response.
///
/// Properties:
/// * [token] - Google ID token from the native Google Sign-In SDK
/// * [accessToken] 
/// * [nonce] 
@BuiltValue()
abstract class SocialSignInInputIdToken implements Built<SocialSignInInputIdToken, SocialSignInInputIdTokenBuilder> {
  /// Google ID token from the native Google Sign-In SDK
  @BuiltValueField(wireName: r'token')
  String get token;

  @BuiltValueField(wireName: r'accessToken')
  String? get accessToken;

  @BuiltValueField(wireName: r'nonce')
  String? get nonce;

  SocialSignInInputIdToken._();

  factory SocialSignInInputIdToken([void updates(SocialSignInInputIdTokenBuilder b)]) = _$SocialSignInInputIdToken;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SocialSignInInputIdTokenBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SocialSignInInputIdToken> get serializer => _$SocialSignInInputIdTokenSerializer();
}

class _$SocialSignInInputIdTokenSerializer implements PrimitiveSerializer<SocialSignInInputIdToken> {
  @override
  final Iterable<Type> types = const [SocialSignInInputIdToken, _$SocialSignInInputIdToken];

  @override
  final String wireName = r'SocialSignInInputIdToken';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SocialSignInInputIdToken object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
    if (object.accessToken != null) {
      yield r'accessToken';
      yield serializers.serialize(
        object.accessToken,
        specifiedType: const FullType(String),
      );
    }
    if (object.nonce != null) {
      yield r'nonce';
      yield serializers.serialize(
        object.nonce,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SocialSignInInputIdToken object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SocialSignInInputIdTokenBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        case r'accessToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.accessToken = valueDes;
          break;
        case r'nonce':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.nonce = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SocialSignInInputIdToken deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SocialSignInInputIdTokenBuilder();
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


