//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/social_sign_in_input_id_token.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'social_sign_in_input.g.dart';

/// SocialSignInInput
///
/// Properties:
/// * [provider] 
/// * [callbackURL] - Where to land after the OAuth redirect flow (web flow only)
/// * [disableRedirect] 
/// * [idToken] 
@BuiltValue()
abstract class SocialSignInInput implements Built<SocialSignInInput, SocialSignInInputBuilder> {
  @BuiltValueField(wireName: r'provider')
  SocialSignInInputProviderEnum get provider;
  // enum providerEnum {  google,  };

  /// Where to land after the OAuth redirect flow (web flow only)
  @BuiltValueField(wireName: r'callbackURL')
  String? get callbackURL;

  @BuiltValueField(wireName: r'disableRedirect')
  bool? get disableRedirect;

  @BuiltValueField(wireName: r'idToken')
  SocialSignInInputIdToken? get idToken;

  SocialSignInInput._();

  factory SocialSignInInput([void updates(SocialSignInInputBuilder b)]) = _$SocialSignInInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SocialSignInInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SocialSignInInput> get serializer => _$SocialSignInInputSerializer();
}

class _$SocialSignInInputSerializer implements PrimitiveSerializer<SocialSignInInput> {
  @override
  final Iterable<Type> types = const [SocialSignInInput, _$SocialSignInInput];

  @override
  final String wireName = r'SocialSignInInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SocialSignInInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'provider';
    yield serializers.serialize(
      object.provider,
      specifiedType: const FullType(SocialSignInInputProviderEnum),
    );
    if (object.callbackURL != null) {
      yield r'callbackURL';
      yield serializers.serialize(
        object.callbackURL,
        specifiedType: const FullType(String),
      );
    }
    if (object.disableRedirect != null) {
      yield r'disableRedirect';
      yield serializers.serialize(
        object.disableRedirect,
        specifiedType: const FullType(bool),
      );
    }
    if (object.idToken != null) {
      yield r'idToken';
      yield serializers.serialize(
        object.idToken,
        specifiedType: const FullType(SocialSignInInputIdToken),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SocialSignInInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SocialSignInInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'provider':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SocialSignInInputProviderEnum),
          ) as SocialSignInInputProviderEnum;
          result.provider = valueDes;
          break;
        case r'callbackURL':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.callbackURL = valueDes;
          break;
        case r'disableRedirect':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.disableRedirect = valueDes;
          break;
        case r'idToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(SocialSignInInputIdToken),
          ) as SocialSignInInputIdToken?;
          if (valueDes == null) continue;
          result.idToken.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SocialSignInInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SocialSignInInputBuilder();
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


class SocialSignInInputProviderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'google')
  static const SocialSignInInputProviderEnum google = _$socialSignInInputProviderEnum_google;

  static Serializer<SocialSignInInputProviderEnum> get serializer => _$socialSignInInputProviderEnumSerializer;

  const SocialSignInInputProviderEnum._(String name): super(name);

  static BuiltSet<SocialSignInInputProviderEnum> get values => _$socialSignInInputProviderEnumValues;
  static SocialSignInInputProviderEnum valueOf(String name) => _$socialSignInInputProviderEnumValueOf(name);
}

