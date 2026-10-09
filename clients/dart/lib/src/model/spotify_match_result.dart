//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_match_result.g.dart';

/// SpotifyMatchResult
///
/// Properties:
/// * [status] 
/// * [strategy] 
/// * [confidence] - 0…1
/// * [deezerTrackId] 
/// * [title] 
/// * [artist] 
/// * [album] 
/// * [albumId] 
/// * [coverUrl] 
/// * [duration] - seconds
/// * [reason] - why nothing matched (not_found only)
@BuiltValue()
abstract class SpotifyMatchResult implements Built<SpotifyMatchResult, SpotifyMatchResultBuilder> {
  @BuiltValueField(wireName: r'status')
  SpotifyMatchResultStatusEnum get status;
  // enum statusEnum {  matched,  not_found,  };

  @BuiltValueField(wireName: r'strategy')
  SpotifyMatchResultStrategyEnum? get strategy;
  // enum strategyEnum {  isrc,  advanced,  advanced-clean,  fuzzy,  };

  /// 0…1
  @BuiltValueField(wireName: r'confidence')
  num? get confidence;

  @BuiltValueField(wireName: r'deezerTrackId')
  String? get deezerTrackId;

  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'artist')
  String? get artist;

  @BuiltValueField(wireName: r'album')
  String? get album;

  @BuiltValueField(wireName: r'albumId')
  String? get albumId;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  /// seconds
  @BuiltValueField(wireName: r'duration')
  int? get duration;

  /// why nothing matched (not_found only)
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  SpotifyMatchResult._();

  factory SpotifyMatchResult([void updates(SpotifyMatchResultBuilder b)]) = _$SpotifyMatchResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyMatchResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyMatchResult> get serializer => _$SpotifyMatchResultSerializer();
}

class _$SpotifyMatchResultSerializer implements PrimitiveSerializer<SpotifyMatchResult> {
  @override
  final Iterable<Type> types = const [SpotifyMatchResult, _$SpotifyMatchResult];

  @override
  final String wireName = r'SpotifyMatchResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyMatchResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(SpotifyMatchResultStatusEnum),
    );
    if (object.strategy != null) {
      yield r'strategy';
      yield serializers.serialize(
        object.strategy,
        specifiedType: const FullType(SpotifyMatchResultStrategyEnum),
      );
    }
    if (object.confidence != null) {
      yield r'confidence';
      yield serializers.serialize(
        object.confidence,
        specifiedType: const FullType(num),
      );
    }
    if (object.deezerTrackId != null) {
      yield r'deezerTrackId';
      yield serializers.serialize(
        object.deezerTrackId,
        specifiedType: const FullType(String),
      );
    }
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.artist != null) {
      yield r'artist';
      yield serializers.serialize(
        object.artist,
        specifiedType: const FullType(String),
      );
    }
    if (object.album != null) {
      yield r'album';
      yield serializers.serialize(
        object.album,
        specifiedType: const FullType(String),
      );
    }
    if (object.albumId != null) {
      yield r'albumId';
      yield serializers.serialize(
        object.albumId,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.coverUrl != null) {
      yield r'coverUrl';
      yield serializers.serialize(
        object.coverUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.duration != null) {
      yield r'duration';
      yield serializers.serialize(
        object.duration,
        specifiedType: const FullType(int),
      );
    }
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyMatchResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyMatchResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SpotifyMatchResultStatusEnum),
          ) as SpotifyMatchResultStatusEnum;
          result.status = valueDes;
          break;
        case r'strategy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(SpotifyMatchResultStrategyEnum),
          ) as SpotifyMatchResultStrategyEnum?;
          if (valueDes == null) continue;
          result.strategy = valueDes;
          break;
        case r'confidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.confidence = valueDes;
          break;
        case r'deezerTrackId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.deezerTrackId = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.title = valueDes;
          break;
        case r'artist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.artist = valueDes;
          break;
        case r'album':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
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
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.duration = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyMatchResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyMatchResultBuilder();
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


class SpotifyMatchResultStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'matched')
  static const SpotifyMatchResultStatusEnum matched = _$spotifyMatchResultStatusEnum_matched;
  @BuiltValueEnumConst(wireName: r'not_found')
  static const SpotifyMatchResultStatusEnum notFound = _$spotifyMatchResultStatusEnum_notFound;

  static Serializer<SpotifyMatchResultStatusEnum> get serializer => _$spotifyMatchResultStatusEnumSerializer;

  const SpotifyMatchResultStatusEnum._(String name): super(name);

  static BuiltSet<SpotifyMatchResultStatusEnum> get values => _$spotifyMatchResultStatusEnumValues;
  static SpotifyMatchResultStatusEnum valueOf(String name) => _$spotifyMatchResultStatusEnumValueOf(name);
}

class SpotifyMatchResultStrategyEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'isrc')
  static const SpotifyMatchResultStrategyEnum isrc = _$spotifyMatchResultStrategyEnum_isrc;
  @BuiltValueEnumConst(wireName: r'advanced')
  static const SpotifyMatchResultStrategyEnum advanced = _$spotifyMatchResultStrategyEnum_advanced;
  @BuiltValueEnumConst(wireName: r'advanced-clean')
  static const SpotifyMatchResultStrategyEnum advancedClean = _$spotifyMatchResultStrategyEnum_advancedClean;
  @BuiltValueEnumConst(wireName: r'fuzzy')
  static const SpotifyMatchResultStrategyEnum fuzzy = _$spotifyMatchResultStrategyEnum_fuzzy;

  static Serializer<SpotifyMatchResultStrategyEnum> get serializer => _$spotifyMatchResultStrategyEnumSerializer;

  const SpotifyMatchResultStrategyEnum._(String name): super(name);

  static BuiltSet<SpotifyMatchResultStrategyEnum> get values => _$spotifyMatchResultStrategyEnumValues;
  static SpotifyMatchResultStrategyEnum valueOf(String name) => _$spotifyMatchResultStrategyEnumValueOf(name);
}

