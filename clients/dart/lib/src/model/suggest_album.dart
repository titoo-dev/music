//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suggest_album.g.dart';

/// SuggestAlbum
///
/// Properties:
/// * [source_] 
/// * [sourceId] 
/// * [deezerAlbumId] 
/// * [title] 
/// * [artists] 
/// * [coverUrl] 
@BuiltValue()
abstract class SuggestAlbum implements Built<SuggestAlbum, SuggestAlbumBuilder> {
  @BuiltValueField(wireName: r'source')
  SuggestAlbumSource_Enum get source_;
  // enum source_Enum {  deezer,  };

  @BuiltValueField(wireName: r'sourceId')
  String get sourceId;

  @BuiltValueField(wireName: r'deezerAlbumId')
  String get deezerAlbumId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artists')
  BuiltList<String> get artists;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  SuggestAlbum._();

  factory SuggestAlbum([void updates(SuggestAlbumBuilder b)]) = _$SuggestAlbum;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuggestAlbumBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuggestAlbum> get serializer => _$SuggestAlbumSerializer();
}

class _$SuggestAlbumSerializer implements PrimitiveSerializer<SuggestAlbum> {
  @override
  final Iterable<Type> types = const [SuggestAlbum, _$SuggestAlbum];

  @override
  final String wireName = r'SuggestAlbum';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuggestAlbum object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(SuggestAlbumSource_Enum),
    );
    yield r'sourceId';
    yield serializers.serialize(
      object.sourceId,
      specifiedType: const FullType(String),
    );
    yield r'deezerAlbumId';
    yield serializers.serialize(
      object.deezerAlbumId,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'artists';
    yield serializers.serialize(
      object.artists,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'coverUrl';
    yield object.coverUrl == null ? null : serializers.serialize(
      object.coverUrl,
      specifiedType: const FullType.nullable(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SuggestAlbum object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuggestAlbumBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuggestAlbumSource_Enum),
          ) as SuggestAlbumSource_Enum;
          result.source_ = valueDes;
          break;
        case r'sourceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceId = valueDes;
          break;
        case r'deezerAlbumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerAlbumId = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'artists':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.artists.replace(valueDes);
          break;
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SuggestAlbum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuggestAlbumBuilder();
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


class SuggestAlbumSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'deezer')
  static const SuggestAlbumSource_Enum deezer = _$suggestAlbumSourceEnum_deezer;

  static Serializer<SuggestAlbumSource_Enum> get serializer => _$suggestAlbumSourceEnumSerializer;

  const SuggestAlbumSource_Enum._(String name): super(name);

  static BuiltSet<SuggestAlbumSource_Enum> get values => _$suggestAlbumSourceEnumValues;
  static SuggestAlbumSource_Enum valueOf(String name) => _$suggestAlbumSourceEnumValueOf(name);
}

