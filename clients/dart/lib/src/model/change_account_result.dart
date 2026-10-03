//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deezer_user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'change_account_result.g.dart';

/// ChangeAccountResult
///
/// Properties:
/// * [user] 
/// * [selectedAccount] 
/// * [childs] 
@BuiltValue()
abstract class ChangeAccountResult implements Built<ChangeAccountResult, ChangeAccountResultBuilder> {
  @BuiltValueField(wireName: r'user')
  DeezerUser get user;

  @BuiltValueField(wireName: r'selectedAccount')
  int get selectedAccount;

  @BuiltValueField(wireName: r'childs')
  BuiltList<DeezerUser> get childs;

  ChangeAccountResult._();

  factory ChangeAccountResult([void updates(ChangeAccountResultBuilder b)]) = _$ChangeAccountResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ChangeAccountResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ChangeAccountResult> get serializer => _$ChangeAccountResultSerializer();
}

class _$ChangeAccountResultSerializer implements PrimitiveSerializer<ChangeAccountResult> {
  @override
  final Iterable<Type> types = const [ChangeAccountResult, _$ChangeAccountResult];

  @override
  final String wireName = r'ChangeAccountResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ChangeAccountResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(DeezerUser),
    );
    yield r'selectedAccount';
    yield serializers.serialize(
      object.selectedAccount,
      specifiedType: const FullType(int),
    );
    yield r'childs';
    yield serializers.serialize(
      object.childs,
      specifiedType: const FullType(BuiltList, [FullType(DeezerUser)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ChangeAccountResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ChangeAccountResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DeezerUser),
          ) as DeezerUser;
          result.user.replace(valueDes);
          break;
        case r'selectedAccount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.selectedAccount = valueDes;
          break;
        case r'childs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DeezerUser)]),
          ) as BuiltList<DeezerUser>;
          result.childs.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ChangeAccountResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ChangeAccountResultBuilder();
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


