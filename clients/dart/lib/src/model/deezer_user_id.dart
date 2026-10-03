//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'dart:core';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'deezer_user_id.g.dart';

/// Deezer USER_ID
@BuiltValue()
abstract class DeezerUserId implements Built<DeezerUserId, DeezerUserIdBuilder> {
  /// One Of [String], [int]
  OneOf get oneOf;

  DeezerUserId._();

  factory DeezerUserId([void updates(DeezerUserIdBuilder b)]) = _$DeezerUserId;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerUserIdBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerUserId> get serializer => _$DeezerUserIdSerializer();
}

class _$DeezerUserIdSerializer implements PrimitiveSerializer<DeezerUserId> {
  @override
  final Iterable<Type> types = const [DeezerUserId, _$DeezerUserId];

  @override
  final String wireName = r'DeezerUserId';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerUserId object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerUserId object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  DeezerUserId deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerUserIdBuilder();
    Object? oneOfDataSrc;
    final targetType = const FullType(OneOf, [FullType(int), FullType(String), ]);
    oneOfDataSrc = serialized;
    result.oneOf = serializers.deserialize(oneOfDataSrc, specifiedType: targetType) as OneOf;
    return result.build();
  }
}


