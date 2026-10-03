//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_playlist_input.g.dart';

/// CreatePlaylistInput
///
/// Properties:
/// * [title] 
/// * [description] 
@BuiltValue()
abstract class CreatePlaylistInput implements Built<CreatePlaylistInput, CreatePlaylistInputBuilder> {
  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  CreatePlaylistInput._();

  factory CreatePlaylistInput([void updates(CreatePlaylistInputBuilder b)]) = _$CreatePlaylistInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreatePlaylistInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreatePlaylistInput> get serializer => _$CreatePlaylistInputSerializer();
}

class _$CreatePlaylistInputSerializer implements PrimitiveSerializer<CreatePlaylistInput> {
  @override
  final Iterable<Type> types = const [CreatePlaylistInput, _$CreatePlaylistInput];

  @override
  final String wireName = r'CreatePlaylistInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreatePlaylistInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreatePlaylistInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreatePlaylistInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreatePlaylistInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreatePlaylistInputBuilder();
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


