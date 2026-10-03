//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/album_track.dart';
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/album.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_with_tracks.g.dart';

/// AlbumWithTracks
///
/// Properties:
/// * [id] - Internal id (cuid) — use this for /library/albums/{albumId}
/// * [userId] 
/// * [deezerAlbumId] 
/// * [title] 
/// * [artist] 
/// * [coverUrl] 
/// * [trackCount] 
/// * [savedAt] 
/// * [tracks] 
@BuiltValue()
abstract class AlbumWithTracks implements Album, Built<AlbumWithTracks, AlbumWithTracksBuilder> {
  @BuiltValueField(wireName: r'tracks')
  BuiltList<AlbumTrack> get tracks;

  AlbumWithTracks._();

  factory AlbumWithTracks([void updates(AlbumWithTracksBuilder b)]) = _$AlbumWithTracks;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumWithTracksBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumWithTracks> get serializer => _$AlbumWithTracksSerializer();
}

class _$AlbumWithTracksSerializer implements PrimitiveSerializer<AlbumWithTracks> {
  @override
  final Iterable<Type> types = const [AlbumWithTracks, _$AlbumWithTracks];

  @override
  final String wireName = r'AlbumWithTracks';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumWithTracks object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'coverUrl';
    yield object.coverUrl == null ? null : serializers.serialize(
      object.coverUrl,
      specifiedType: const FullType.nullable(String),
    );
    yield r'trackCount';
    yield serializers.serialize(
      object.trackCount,
      specifiedType: const FullType(int),
    );
    yield r'artist';
    yield serializers.serialize(
      object.artist,
      specifiedType: const FullType(String),
    );
    yield r'deezerAlbumId';
    yield serializers.serialize(
      object.deezerAlbumId,
      specifiedType: const FullType(String),
    );
    yield r'savedAt';
    yield serializers.serialize(
      object.savedAt,
      specifiedType: const FullType(DateTime),
    );
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
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(AlbumTrack)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumWithTracks object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumWithTracksBuilder result,
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
        case r'trackCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.trackCount = valueDes;
          break;
        case r'artist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.artist = valueDes;
          break;
        case r'deezerAlbumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deezerAlbumId = valueDes;
          break;
        case r'savedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.savedAt = valueDes;
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
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AlbumTrack)]),
          ) as BuiltList<AlbumTrack>;
          result.tracks.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AlbumWithTracks deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumWithTracksBuilder();
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


