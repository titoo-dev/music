//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suggest_artist.g.dart';

/// SuggestArtist
///
/// Properties:
/// * [source_] 
/// * [sourceId] 
/// * [deezerArtistId] 
/// * [name] 
/// * [imageUrl] 
@BuiltValue()
abstract class SuggestArtist implements Built<SuggestArtist, SuggestArtistBuilder> {
  @BuiltValueField(wireName: r'source')
  SuggestArtistSource_Enum get source_;
  // enum source_Enum {  deezer,  };

  @BuiltValueField(wireName: r'sourceId')
  String get sourceId;

  @BuiltValueField(wireName: r'deezerArtistId')
  String get deezerArtistId;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'imageUrl')
  String? get imageUrl;

  SuggestArtist._();

  factory SuggestArtist([void updates(SuggestArtistBuilder b)]) = _$SuggestArtist;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuggestArtistBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuggestArtist> get serializer => _$SuggestArtistSerializer();
}

class _$SuggestArtistSerializer implements PrimitiveSerializer<SuggestArtist> {
  @override
  final Iterable<Type> types = const [SuggestArtist, _$SuggestArtist];

  @override
  final String wireName = r'SuggestArtist';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuggestArtist object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(SuggestArtistSource_Enum),
    );
    yield r'sourceId';
    yield serializers.serialize(
      object.sourceId,
      specifiedType: const FullType(String),
    );
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
    yield r'imageUrl';
    yield object.imageUrl == null ? null : serializers.serialize(
      object.imageUrl,
      specifiedType: const FullType.nullable(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SuggestArtist object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuggestArtistBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuggestArtistSource_Enum),
          ) as SuggestArtistSource_Enum;
          result.source_ = valueDes;
          break;
        case r'sourceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceId = valueDes;
          break;
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
        case r'imageUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.imageUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SuggestArtist deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuggestArtistBuilder();
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


class SuggestArtistSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'deezer')
  static const SuggestArtistSource_Enum deezer = _$suggestArtistSourceEnum_deezer;

  static Serializer<SuggestArtistSource_Enum> get serializer => _$suggestArtistSourceEnumSerializer;

  const SuggestArtistSource_Enum._(String name): super(name);

  static BuiltSet<SuggestArtistSource_Enum> get values => _$suggestArtistSourceEnumValues;
  static SuggestArtistSource_Enum valueOf(String name) => _$suggestArtistSourceEnumValueOf(name);
}

