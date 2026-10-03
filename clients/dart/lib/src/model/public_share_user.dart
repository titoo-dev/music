//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'public_share_user.g.dart';

/// PublicShareUser
///
/// Properties:
/// * [name] 
/// * [image] 
@BuiltValue()
abstract class PublicShareUser implements Built<PublicShareUser, PublicShareUserBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'image')
  String? get image;

  PublicShareUser._();

  factory PublicShareUser([void updates(PublicShareUserBuilder b)]) = _$PublicShareUser;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PublicShareUserBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PublicShareUser> get serializer => _$PublicShareUserSerializer();
}

class _$PublicShareUserSerializer implements PrimitiveSerializer<PublicShareUser> {
  @override
  final Iterable<Type> types = const [PublicShareUser, _$PublicShareUser];

  @override
  final String wireName = r'PublicShareUser';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PublicShareUser object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'image';
    yield object.image == null ? null : serializers.serialize(
      object.image,
      specifiedType: const FullType.nullable(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PublicShareUser object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PublicShareUserBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'image':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.image = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PublicShareUser deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PublicShareUserBuilder();
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


