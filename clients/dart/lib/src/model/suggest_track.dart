//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suggest_track.g.dart';

/// SuggestTrack
///
/// Properties:
/// * [source_] 
/// * [sourceId] 
/// * [deezerTrackId] 
/// * [title] 
/// * [artists] 
/// * [artistId] 
/// * [album] 
/// * [albumId] 
/// * [durationMs] 
/// * [coverUrl] 
@BuiltValue()
abstract class SuggestTrack implements Built<SuggestTrack, SuggestTrackBuilder> {
  @BuiltValueField(wireName: r'source')
  SuggestTrackSource_Enum get source_;
  // enum source_Enum {  deezer,  };

  @BuiltValueField(wireName: r'sourceId')
  String get sourceId;

  @BuiltValueField(wireName: r'deezerTrackId')
  String get deezerTrackId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artists')
  BuiltList<String> get artists;

  @BuiltValueField(wireName: r'artistId')
  String? get artistId;

  @BuiltValueField(wireName: r'album')
  String get album;

  @BuiltValueField(wireName: r'albumId')
  String? get albumId;

  @BuiltValueField(wireName: r'durationMs')
  int get durationMs;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  SuggestTrack._();

  factory SuggestTrack([void updates(SuggestTrackBuilder b)]) = _$SuggestTrack;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuggestTrackBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuggestTrack> get serializer => _$SuggestTrackSerializer();
}

class _$SuggestTrackSerializer implements PrimitiveSerializer<SuggestTrack> {
  @override
  final Iterable<Type> types = const [SuggestTrack, _$SuggestTrack];

  @override
  final String wireName = r'SuggestTrack';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuggestTrack object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(SuggestTrackSource_Enum),
    );
    yield r'sourceId';
    yield serializers.serialize(
      object.sourceId,
      specifiedType: const FullType(String),
    );
    yield r'deezerTrackId';
    yield serializers.serialize(
      object.deezerTrackId,
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
    yield r'artistId';
    yield object.artistId == null ? null : serializers.serialize(
      object.artistId,
      specifiedType: const FullType.nullable(String),
    );
    yield r'album';
    yield serializers.serialize(
      object.album,
      specifiedType: const FullType(String),
    );
    yield r'albumId';
    yield object.albumId == null ? null : serializers.serialize(
      object.albumId,
      specifiedType: const FullType.nullable(String),
    );
    yield r'durationMs';
    yield serializers.serialize(
      object.durationMs,
      specifiedType: const FullType(int),
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
    SuggestTrack object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuggestTrackBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuggestTrackSource_Enum),
          ) as SuggestTrackSource_Enum;
          result.source_ = valueDes;
          break;
        case r'sourceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceId = valueDes;
          break;
        case r'deezerTrackId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerTrackId = valueDes;
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
        case r'artistId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.artistId = valueDes;
          break;
        case r'album':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.album = valueDes;
          break;
        case r'albumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.albumId = valueDes;
          break;
        case r'durationMs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.durationMs = valueDes;
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
  SuggestTrack deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuggestTrackBuilder();
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


class SuggestTrackSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'deezer')
  static const SuggestTrackSource_Enum deezer = _$suggestTrackSourceEnum_deezer;

  static Serializer<SuggestTrackSource_Enum> get serializer => _$suggestTrackSourceEnumSerializer;

  const SuggestTrackSource_Enum._(String name): super(name);

  static BuiltSet<SuggestTrackSource_Enum> get values => _$suggestTrackSourceEnumValues;
  static SuggestTrackSource_Enum valueOf(String name) => _$suggestTrackSourceEnumValueOf(name);
}

