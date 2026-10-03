//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'follow_artist_input.g.dart';

/// FollowArtistInput
///
/// Properties:
/// * [deezerArtistId] 
/// * [name] 
/// * [pictureUrl] 
@BuiltValue()
abstract class FollowArtistInput implements Built<FollowArtistInput, FollowArtistInputBuilder> {
  @BuiltValueField(wireName: r'deezerArtistId')
  String get deezerArtistId;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'pictureUrl')
  String? get pictureUrl;

  FollowArtistInput._();

  factory FollowArtistInput([void updates(FollowArtistInputBuilder b)]) = _$FollowArtistInput;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FollowArtistInputBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FollowArtistInput> get serializer => _$FollowArtistInputSerializer();
}

class _$FollowArtistInputSerializer implements PrimitiveSerializer<FollowArtistInput> {
  @override
  final Iterable<Type> types = const [FollowArtistInput, _$FollowArtistInput];

  @override
  final String wireName = r'FollowArtistInput';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FollowArtistInput object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'deezerArtistId';
    yield serializers.serialize(
      object.deezerArtistId,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.pictureUrl != null) {
      yield r'pictureUrl';
      yield serializers.serialize(
        object.pictureUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    FollowArtistInput object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FollowArtistInputBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deezerArtistId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerArtistId = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'pictureUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.pictureUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FollowArtistInput deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FollowArtistInputBuilder();
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


