//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_api_list.g.dart';

/// Paginated Deezer public API list (api.deezer.com).
///
/// Properties:
/// * [data] 
/// * [total] 
/// * [next] 
/// * [prev] 
@BuiltValue()
abstract class DeezerApiList implements Built<DeezerApiList, DeezerApiListBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<BuiltMap<String, JsonObject?>>? get data;

  @BuiltValueField(wireName: r'total')
  int? get total;

  @BuiltValueField(wireName: r'next')
  String? get next;

  @BuiltValueField(wireName: r'prev')
  String? get prev;

  DeezerApiList._();

  factory DeezerApiList([void updates(DeezerApiListBuilder b)]) = _$DeezerApiList;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerApiListBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerApiList> get serializer => _$DeezerApiListSerializer();
}

class _$DeezerApiListSerializer implements PrimitiveSerializer<DeezerApiList> {
  @override
  final Iterable<Type> types = const [DeezerApiList, _$DeezerApiList];

  @override
  final String wireName = r'DeezerApiList';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerApiList object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.data != null) {
      yield r'data';
      yield serializers.serialize(
        object.data,
        specifiedType: const FullType(BuiltList, [FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)])]),
      );
    }
    if (object.total != null) {
      yield r'total';
      yield serializers.serialize(
        object.total,
        specifiedType: const FullType(int),
      );
    }
    if (object.next != null) {
      yield r'next';
      yield serializers.serialize(
        object.next,
        specifiedType: const FullType(String),
      );
    }
    if (object.prev != null) {
      yield r'prev';
      yield serializers.serialize(
        object.prev,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerApiList object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerApiListBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)])]),
          ) as BuiltList<BuiltMap<String, JsonObject?>>?;
          if (valueDes == null) continue;
          result.data.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.total = valueDes;
          break;
        case r'next':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.next = valueDes;
          break;
        case r'prev':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.prev = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeezerApiList deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerApiListBuilder();
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


