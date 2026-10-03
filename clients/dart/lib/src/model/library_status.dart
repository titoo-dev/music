//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_status.g.dart';

/// LibraryStatus
///
/// Properties:
/// * [tracks] - Subset of trackIds that are saved
/// * [albums] - Subset of albumIds that are saved
@BuiltValue()
abstract class LibraryStatus implements Built<LibraryStatus, LibraryStatusBuilder> {
  /// Subset of trackIds that are saved
  @BuiltValueField(wireName: r'tracks')
  BuiltList<String> get tracks;

  /// Subset of albumIds that are saved
  @BuiltValueField(wireName: r'albums')
  BuiltList<String> get albums;

  LibraryStatus._();

  factory LibraryStatus([void updates(LibraryStatusBuilder b)]) = _$LibraryStatus;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryStatusBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryStatus> get serializer => _$LibraryStatusSerializer();
}

class _$LibraryStatusSerializer implements PrimitiveSerializer<LibraryStatus> {
  @override
  final Iterable<Type> types = const [LibraryStatus, _$LibraryStatus];

  @override
  final String wireName = r'LibraryStatus';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'albums';
    yield serializers.serialize(
      object.albums,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LibraryStatus object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryStatusBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tracks.replace(valueDes);
          break;
        case r'albums':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.albums.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LibraryStatus deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryStatusBuilder();
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


