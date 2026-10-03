//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/playlist.dart';
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/playlist_summary_all_of_count.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'playlist_summary.g.dart';

/// PlaylistSummary
///
/// Properties:
/// * [id] 
/// * [userId] 
/// * [title] 
/// * [description] 
/// * [coverUrl] 
/// * [isPublic] 
/// * [createdAt] 
/// * [updatedAt] 
/// * [count] 
/// * [covers] - Cover URLs of the first 4 tracks
/// * [containsTrack] - Only present when `?trackId=` is passed
@BuiltValue()
abstract class PlaylistSummary implements Playlist, Built<PlaylistSummary, PlaylistSummaryBuilder> {
  @BuiltValueField(wireName: r'_count')
  PlaylistSummaryAllOfCount get count;

  /// Only present when `?trackId=` is passed
  @BuiltValueField(wireName: r'containsTrack')
  bool? get containsTrack;

  /// Cover URLs of the first 4 tracks
  @BuiltValueField(wireName: r'covers')
  BuiltList<String> get covers;

  PlaylistSummary._();

  factory PlaylistSummary([void updates(PlaylistSummaryBuilder b)]) = _$PlaylistSummary;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PlaylistSummaryBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PlaylistSummary> get serializer => _$PlaylistSummarySerializer();
}

class _$PlaylistSummarySerializer implements PrimitiveSerializer<PlaylistSummary> {
  @override
  final Iterable<Type> types = const [PlaylistSummary, _$PlaylistSummary];

  @override
  final String wireName = r'PlaylistSummary';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PlaylistSummary object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'coverUrl';
    yield object.coverUrl == null ? null : serializers.serialize(
      object.coverUrl,
      specifiedType: const FullType.nullable(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'_count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(PlaylistSummaryAllOfCount),
    );
    yield r'description';
    yield object.description == null ? null : serializers.serialize(
      object.description,
      specifiedType: const FullType.nullable(String),
    );
    yield r'isPublic';
    yield serializers.serialize(
      object.isPublic,
      specifiedType: const FullType(bool),
    );
    if (object.containsTrack != null) {
      yield r'containsTrack';
      yield serializers.serialize(
        object.containsTrack,
        specifiedType: const FullType(bool),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'covers';
    yield serializers.serialize(
      object.covers,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PlaylistSummary object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PlaylistSummaryBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'_count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PlaylistSummaryAllOfCount),
          ) as PlaylistSummaryAllOfCount;
          result.count.replace(valueDes);
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'isPublic':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isPublic = valueDes;
          break;
        case r'containsTrack':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.containsTrack = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'covers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.covers.replace(valueDes);
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PlaylistSummary deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PlaylistSummaryBuilder();
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


