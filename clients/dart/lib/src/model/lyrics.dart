//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'lyrics.g.dart';

/// Lyrics
///
/// Properties:
/// * [source_] 
/// * [syncedLyrics] - LRC format (`[mm:ss.xx]line` per line)
/// * [plainLyrics] 
/// * [instrumental] 
@BuiltValue()
abstract class Lyrics implements Built<Lyrics, LyricsBuilder> {
  @BuiltValueField(wireName: r'source')
  LyricsSource_Enum? get source_;
  // enum source_Enum {  lrclib,  deezer,  };

  /// LRC format (`[mm:ss.xx]line` per line)
  @BuiltValueField(wireName: r'syncedLyrics')
  String? get syncedLyrics;

  @BuiltValueField(wireName: r'plainLyrics')
  String? get plainLyrics;

  @BuiltValueField(wireName: r'instrumental')
  bool get instrumental;

  Lyrics._();

  factory Lyrics([void updates(LyricsBuilder b)]) = _$Lyrics;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LyricsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Lyrics> get serializer => _$LyricsSerializer();
}

class _$LyricsSerializer implements PrimitiveSerializer<Lyrics> {
  @override
  final Iterable<Type> types = const [Lyrics, _$Lyrics];

  @override
  final String wireName = r'Lyrics';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Lyrics object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'source';
    yield object.source_ == null ? null : serializers.serialize(
      object.source_,
      specifiedType: const FullType.nullable(LyricsSource_Enum),
    );
    yield r'syncedLyrics';
    yield object.syncedLyrics == null ? null : serializers.serialize(
      object.syncedLyrics,
      specifiedType: const FullType.nullable(String),
    );
    yield r'plainLyrics';
    yield object.plainLyrics == null ? null : serializers.serialize(
      object.plainLyrics,
      specifiedType: const FullType.nullable(String),
    );
    yield r'instrumental';
    yield serializers.serialize(
      object.instrumental,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Lyrics object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LyricsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(LyricsSource_Enum),
          ) as LyricsSource_Enum?;
          if (valueDes == null) continue;
          result.source_ = valueDes;
          break;
        case r'syncedLyrics':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.syncedLyrics = valueDes;
          break;
        case r'plainLyrics':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.plainLyrics = valueDes;
          break;
        case r'instrumental':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.instrumental = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  Lyrics deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LyricsBuilder();
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


class LyricsSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'lrclib')
  static const LyricsSource_Enum lrclib = _$lyricsSourceEnum_lrclib;
  @BuiltValueEnumConst(wireName: r'deezer')
  static const LyricsSource_Enum deezer = _$lyricsSourceEnum_deezer;

  static Serializer<LyricsSource_Enum> get serializer => _$lyricsSourceEnumSerializer;

  const LyricsSource_Enum._(String name): super(name);

  static BuiltSet<LyricsSource_Enum> get values => _$lyricsSourceEnumValues;
  static LyricsSource_Enum valueOf(String name) => _$lyricsSourceEnumValueOf(name);
}

