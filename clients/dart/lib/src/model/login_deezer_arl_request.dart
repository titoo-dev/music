//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'login_deezer_arl_request.g.dart';

/// LoginDeezerArlRequest
///
/// Properties:
/// * [arl] - Deezer `arl` cookie value
/// * [child] - Child account index
@BuiltValue()
abstract class LoginDeezerArlRequest implements Built<LoginDeezerArlRequest, LoginDeezerArlRequestBuilder> {
  /// Deezer `arl` cookie value
  @BuiltValueField(wireName: r'arl')
  String get arl;

  /// Child account index
  @BuiltValueField(wireName: r'child')
  int? get child;

  LoginDeezerArlRequest._();

  factory LoginDeezerArlRequest([void updates(LoginDeezerArlRequestBuilder b)]) = _$LoginDeezerArlRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LoginDeezerArlRequestBuilder b) => b
      ..child = 0;

  @BuiltValueSerializer(custom: true)
  static Serializer<LoginDeezerArlRequest> get serializer => _$LoginDeezerArlRequestSerializer();
}

class _$LoginDeezerArlRequestSerializer implements PrimitiveSerializer<LoginDeezerArlRequest> {
  @override
  final Iterable<Type> types = const [LoginDeezerArlRequest, _$LoginDeezerArlRequest];

  @override
  final String wireName = r'LoginDeezerArlRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LoginDeezerArlRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'arl';
    yield serializers.serialize(
      object.arl,
      specifiedType: const FullType(String),
    );
    if (object.child != null) {
      yield r'child';
      yield serializers.serialize(
        object.child,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LoginDeezerArlRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LoginDeezerArlRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'arl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.arl = valueDes;
          break;
        case r'child':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
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
  LoginDeezerArlRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LoginDeezerArlRequestBuilder();
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


