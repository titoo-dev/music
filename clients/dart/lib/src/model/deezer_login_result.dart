//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deezer_user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_login_result.g.dart';

/// DeezerLoginResult
///
/// Properties:
/// * [user] 
/// * [childs] - Family / child accounts
/// * [currentChild] - Index of the selected account in `childs`
/// * [hasMultipleAccounts] 
@BuiltValue()
abstract class DeezerLoginResult implements Built<DeezerLoginResult, DeezerLoginResultBuilder> {
  @BuiltValueField(wireName: r'user')
  DeezerUser get user;

  /// Family / child accounts
  @BuiltValueField(wireName: r'childs')
  BuiltList<DeezerUser> get childs;

  /// Index of the selected account in `childs`
  @BuiltValueField(wireName: r'currentChild')
  int get currentChild;

  @BuiltValueField(wireName: r'hasMultipleAccounts')
  bool get hasMultipleAccounts;

  DeezerLoginResult._();

  factory DeezerLoginResult([void updates(DeezerLoginResultBuilder b)]) = _$DeezerLoginResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerLoginResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerLoginResult> get serializer => _$DeezerLoginResultSerializer();
}

class _$DeezerLoginResultSerializer implements PrimitiveSerializer<DeezerLoginResult> {
  @override
  final Iterable<Type> types = const [DeezerLoginResult, _$DeezerLoginResult];

  @override
  final String wireName = r'DeezerLoginResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerLoginResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(DeezerUser),
    );
    yield r'childs';
    yield serializers.serialize(
      object.childs,
      specifiedType: const FullType(BuiltList, [FullType(DeezerUser)]),
    );
    yield r'currentChild';
    yield serializers.serialize(
      object.currentChild,
      specifiedType: const FullType(int),
    );
    yield r'hasMultipleAccounts';
    yield serializers.serialize(
      object.hasMultipleAccounts,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerLoginResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerLoginResultBuilder result,
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
        case r'childs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DeezerUser)]),
          ) as BuiltList<DeezerUser>;
          result.childs.replace(valueDes);
          break;
        case r'currentChild':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.currentChild = valueDes;
          break;
        case r'hasMultipleAccounts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasMultipleAccounts = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeezerLoginResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerLoginResultBuilder();
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


