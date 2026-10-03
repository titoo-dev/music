//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/better_auth_user.dart';
import 'package:wavelet_api/src/model/better_auth_session_session.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'better_auth_session.g.dart';

/// BetterAuthSession
///
/// Properties:
/// * [session] 
/// * [user] 
@BuiltValue()
abstract class BetterAuthSession implements Built<BetterAuthSession, BetterAuthSessionBuilder> {
  @BuiltValueField(wireName: r'session')
  BetterAuthSessionSession get session;

  @BuiltValueField(wireName: r'user')
  BetterAuthUser get user;

  BetterAuthSession._();

  factory BetterAuthSession([void updates(BetterAuthSessionBuilder b)]) = _$BetterAuthSession;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BetterAuthSessionBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BetterAuthSession> get serializer => _$BetterAuthSessionSerializer();
}

class _$BetterAuthSessionSerializer implements PrimitiveSerializer<BetterAuthSession> {
  @override
  final Iterable<Type> types = const [BetterAuthSession, _$BetterAuthSession];

  @override
  final String wireName = r'BetterAuthSession';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BetterAuthSession object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'session';
    yield serializers.serialize(
      object.session,
      specifiedType: const FullType(BetterAuthSessionSession),
    );
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(BetterAuthUser),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BetterAuthSession object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BetterAuthSessionBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'session':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BetterAuthSessionSession),
          ) as BetterAuthSessionSession;
          result.session.replace(valueDes);
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BetterAuthUser),
          ) as BetterAuthUser;
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
  BetterAuthSession deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BetterAuthSessionBuilder();
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


