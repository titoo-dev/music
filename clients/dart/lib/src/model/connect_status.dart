//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deezer_user.dart';
import 'package:wavelet_api/src/model/auth_user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'connect_status.g.dart';

/// ConnectStatus
///
/// Properties:
/// * [authenticated] - A better-auth session is present
/// * [user] 
/// * [deezerLoggedIn] 
/// * [deezerUser] 
/// * [deezerAvailable] 
/// * [settings] - Same shape as SettingsBundle, or `{}` if the app is not initialized.
@BuiltValue()
abstract class ConnectStatus implements Built<ConnectStatus, ConnectStatusBuilder> {
  /// A better-auth session is present
  @BuiltValueField(wireName: r'authenticated')
  bool get authenticated;

  @BuiltValueField(wireName: r'user')
  AuthUser? get user;

  @BuiltValueField(wireName: r'deezerLoggedIn')
  bool get deezerLoggedIn;

  @BuiltValueField(wireName: r'deezerUser')
  DeezerUser? get deezerUser;

  @BuiltValueField(wireName: r'deezerAvailable')
  ConnectStatusDeezerAvailableEnum get deezerAvailable;
  // enum deezerAvailableEnum {  yes,  no,  no-network,  };

  /// Same shape as SettingsBundle, or `{}` if the app is not initialized.
  @BuiltValueField(wireName: r'settings')
  BuiltMap<String, JsonObject?> get settings;

  ConnectStatus._();

  factory ConnectStatus([void updates(ConnectStatusBuilder b)]) = _$ConnectStatus;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConnectStatusBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConnectStatus> get serializer => _$ConnectStatusSerializer();
}

class _$ConnectStatusSerializer implements PrimitiveSerializer<ConnectStatus> {
  @override
  final Iterable<Type> types = const [ConnectStatus, _$ConnectStatus];

  @override
  final String wireName = r'ConnectStatus';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConnectStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'authenticated';
    yield serializers.serialize(
      object.authenticated,
      specifiedType: const FullType(bool),
    );
    yield r'user';
    yield object.user == null ? null : serializers.serialize(
      object.user,
      specifiedType: const FullType.nullable(AuthUser),
    );
    yield r'deezerLoggedIn';
    yield serializers.serialize(
      object.deezerLoggedIn,
      specifiedType: const FullType(bool),
    );
    yield r'deezerUser';
    yield object.deezerUser == null ? null : serializers.serialize(
      object.deezerUser,
      specifiedType: const FullType.nullable(DeezerUser),
    );
    yield r'deezerAvailable';
    yield serializers.serialize(
      object.deezerAvailable,
      specifiedType: const FullType(ConnectStatusDeezerAvailableEnum),
    );
    yield r'settings';
    yield serializers.serialize(
      object.settings,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ConnectStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConnectStatusBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'authenticated':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.authenticated = valueDes;
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(AuthUser),
          ) as AuthUser?;
          if (valueDes == null) continue;
          result.user.replace(valueDes);
          break;
        case r'deezerLoggedIn':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.deezerLoggedIn = valueDes;
          break;
        case r'deezerUser':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DeezerUser),
          ) as DeezerUser?;
          if (valueDes == null) continue;
          result.deezerUser.replace(valueDes);
          break;
        case r'deezerAvailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ConnectStatusDeezerAvailableEnum),
          ) as ConnectStatusDeezerAvailableEnum;
          result.deezerAvailable = valueDes;
          break;
        case r'settings':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.settings.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ConnectStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConnectStatusBuilder();
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


class ConnectStatusDeezerAvailableEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'yes')
  static const ConnectStatusDeezerAvailableEnum yes = _$connectStatusDeezerAvailableEnum_yes;
  @BuiltValueEnumConst(wireName: r'no')
  static const ConnectStatusDeezerAvailableEnum no = _$connectStatusDeezerAvailableEnum_no;
  @BuiltValueEnumConst(wireName: r'no-network')
  static const ConnectStatusDeezerAvailableEnum noNetwork = _$connectStatusDeezerAvailableEnum_noNetwork;

  static Serializer<ConnectStatusDeezerAvailableEnum> get serializer => _$connectStatusDeezerAvailableEnumSerializer;

  const ConnectStatusDeezerAvailableEnum._(String name): super(name);

  static BuiltSet<ConnectStatusDeezerAvailableEnum> get values => _$connectStatusDeezerAvailableEnumValues;
  static ConnectStatusDeezerAvailableEnum valueOf(String name) => _$connectStatusDeezerAvailableEnumValueOf(name);
}

