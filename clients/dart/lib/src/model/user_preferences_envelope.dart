//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/user_preferences.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_preferences_envelope.g.dart';

/// UserPreferencesEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class UserPreferencesEnvelope implements Built<UserPreferencesEnvelope, UserPreferencesEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  UserPreferences get data;

  UserPreferencesEnvelope._();

  factory UserPreferencesEnvelope([void updates(UserPreferencesEnvelopeBuilder b)]) = _$UserPreferencesEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserPreferencesEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserPreferencesEnvelope> get serializer => _$UserPreferencesEnvelopeSerializer();
}

class _$UserPreferencesEnvelopeSerializer implements PrimitiveSerializer<UserPreferencesEnvelope> {
  @override
  final Iterable<Type> types = const [UserPreferencesEnvelope, _$UserPreferencesEnvelope];

  @override
  final String wireName = r'UserPreferencesEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserPreferencesEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(UserPreferences),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserPreferencesEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserPreferencesEnvelopeBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserPreferences),
          ) as UserPreferences;
          result.data.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserPreferencesEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserPreferencesEnvelopeBuilder();
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


