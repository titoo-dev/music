//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_status_input.g.dart';

/// LibraryStatusInput
///
/// Properties:
/// * [trackIds] - Deezer track ids to check
/// * [albumIds] - Deezer album ids to check
@BuiltValue()
abstract class LibraryStatusInput implements Built<LibraryStatusInput, LibraryStatusInputBuilder> {
  /// Deezer track ids to check
  @BuiltValueField(wireName: r'trackIds')
  BuiltList<String>? get trackIds;

  /// Deezer album ids to check
  @BuiltValueField(wireName: r'albumIds')
  BuiltList<String>? get albumIds;

  LibraryStatusInput._();

  factory LibraryStatusInput([void updates(LibraryStatusInputBuilder b)]) = _$LibraryStatusInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryStatusInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryStatusInput> get serializer => _$LibraryStatusInputSerializer();
}

class _$LibraryStatusInputSerializer implements PrimitiveSerializer<LibraryStatusInput> {
  @override
  final Iterable<Type> types = const [LibraryStatusInput, _$LibraryStatusInput];

  @override
  final String wireName = r'LibraryStatusInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryStatusInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.trackIds != null) {
      yield r'trackIds';
      yield serializers.serialize(
        object.trackIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.albumIds != null) {
      yield r'albumIds';
      yield serializers.serialize(
        object.albumIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryStatusInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryStatusInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'trackIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.trackIds.replace(valueDes);
          break;
        case r'albumIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.albumIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LibraryStatusInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryStatusInputBuilder();
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


