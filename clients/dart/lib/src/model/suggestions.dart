//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/suggest_artist.dart';
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/suggest_track.dart';
import 'package:wavelet_api/src/model/suggest_album.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suggestions.g.dart';

/// Suggestions
///
/// Properties:
/// * [tracks] 
/// * [albums] 
/// * [artists] 
/// * [source_] 
@BuiltValue()
abstract class Suggestions implements Built<Suggestions, SuggestionsBuilder> {
  @BuiltValueField(wireName: r'tracks')
  BuiltList<SuggestTrack> get tracks;

  @BuiltValueField(wireName: r'albums')
  BuiltList<SuggestAlbum> get albums;

  @BuiltValueField(wireName: r'artists')
  BuiltList<SuggestArtist> get artists;

  @BuiltValueField(wireName: r'source')
  SuggestionsSource_Enum get source_;
  // enum source_Enum {  deezer,  };

  Suggestions._();

  factory Suggestions([void updates(SuggestionsBuilder b)]) = _$Suggestions;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuggestionsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Suggestions> get serializer => _$SuggestionsSerializer();
}

class _$SuggestionsSerializer implements PrimitiveSerializer<Suggestions> {
  @override
  final Iterable<Type> types = const [Suggestions, _$Suggestions];

  @override
  final String wireName = r'Suggestions';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Suggestions object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(SuggestTrack)]),
    );
    yield r'albums';
    yield serializers.serialize(
      object.albums,
      specifiedType: const FullType(BuiltList, [FullType(SuggestAlbum)]),
    );
    yield r'artists';
    yield serializers.serialize(
      object.artists,
      specifiedType: const FullType(BuiltList, [FullType(SuggestArtist)]),
    );
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(SuggestionsSource_Enum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Suggestions object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuggestionsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SuggestTrack)]),
          ) as BuiltList<SuggestTrack>;
          result.tracks.replace(valueDes);
          break;
        case r'albums':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SuggestAlbum)]),
          ) as BuiltList<SuggestAlbum>;
          result.albums.replace(valueDes);
          break;
        case r'artists':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SuggestArtist)]),
          ) as BuiltList<SuggestArtist>;
          result.artists.replace(valueDes);
          break;
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuggestionsSource_Enum),
          ) as SuggestionsSource_Enum;
          result.source_ = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  Suggestions deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuggestionsBuilder();
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


class SuggestionsSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'deezer')
  static const SuggestionsSource_Enum deezer = _$suggestionsSourceEnum_deezer;

  static Serializer<SuggestionsSource_Enum> get serializer => _$suggestionsSourceEnumSerializer;

  const SuggestionsSource_Enum._(String name): super(name);

  static BuiltSet<SuggestionsSource_Enum> get values => _$suggestionsSourceEnumValues;
  static SuggestionsSource_Enum valueOf(String name) => _$suggestionsSourceEnumValueOf(name);
}

