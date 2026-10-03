//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/better_auth_user.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'social_sign_in_result.g.dart';

/// better-auth may send extra keys; they are ignored.
///
/// Properties:
/// * [redirect] 
/// * [url] - Google consent URL (redirect flow)
/// * [token] - Session token (idToken flow)
/// * [user] 
@BuiltValue()
abstract class SocialSignInResult implements Built<SocialSignInResult, SocialSignInResultBuilder> {
  @BuiltValueField(wireName: r'redirect')
  bool? get redirect;

  /// Google consent URL (redirect flow)
  @BuiltValueField(wireName: r'url')
  String? get url;

  /// Session token (idToken flow)
  @BuiltValueField(wireName: r'token')
  String? get token;

  @BuiltValueField(wireName: r'user')
  BetterAuthUser? get user;

  SocialSignInResult._();

  factory SocialSignInResult([void updates(SocialSignInResultBuilder b)]) = _$SocialSignInResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SocialSignInResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SocialSignInResult> get serializer => _$SocialSignInResultSerializer();
}

class _$SocialSignInResultSerializer implements PrimitiveSerializer<SocialSignInResult> {
  @override
  final Iterable<Type> types = const [SocialSignInResult, _$SocialSignInResult];

  @override
  final String wireName = r'SocialSignInResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SocialSignInResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.redirect != null) {
      yield r'redirect';
      yield serializers.serialize(
        object.redirect,
        specifiedType: const FullType(bool),
      );
    }
    if (object.url != null) {
      yield r'url';
      yield serializers.serialize(
        object.url,
        specifiedType: const FullType(String),
      );
    }
    if (object.token != null) {
      yield r'token';
      yield serializers.serialize(
        object.token,
        specifiedType: const FullType(String),
      );
    }
    if (object.user != null) {
      yield r'user';
      yield serializers.serialize(
        object.user,
        specifiedType: const FullType(BetterAuthUser),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SocialSignInResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SocialSignInResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'redirect':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.redirect = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.url = valueDes;
          break;
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.token = valueDes;
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BetterAuthUser),
          ) as BetterAuthUser?;
          if (valueDes == null) continue;
          result.user.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SocialSignInResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SocialSignInResultBuilder();
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


