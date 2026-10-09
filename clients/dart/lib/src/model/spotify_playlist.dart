//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_playlist.g.dart';

/// SpotifyPlaylist
///
/// Properties:
/// * [spotifyId] 
/// * [title] 
/// * [description] 
/// * [ownerName] 
/// * [coverUrl] 
/// * [totalTracks] - real size of the playlist (tracks is capped at 1000)
/// * [tracks] 
/// * [source_] 
/// * [limited] - true when Spotify only exposed the first 100 tracks
@BuiltValue()
abstract class SpotifyPlaylist implements Built<SpotifyPlaylist, SpotifyPlaylistBuilder> {
  @BuiltValueField(wireName: r'spotifyId')
  String get spotifyId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'ownerName')
  String? get ownerName;

  @BuiltValueField(wireName: r'coverUrl')
  String? get coverUrl;

  /// real size of the playlist (tracks is capped at 1000)
  @BuiltValueField(wireName: r'totalTracks')
  int get totalTracks;

  @BuiltValueField(wireName: r'tracks')
  BuiltList<SpotifyTrack> get tracks;

  @BuiltValueField(wireName: r'source')
  SpotifyPlaylistSource_Enum get source_;
  // enum source_Enum {  api,  embed,  };

  /// true when Spotify only exposed the first 100 tracks
  @BuiltValueField(wireName: r'limited')
  bool get limited;

  SpotifyPlaylist._();

  factory SpotifyPlaylist([void updates(SpotifyPlaylistBuilder b)]) = _$SpotifyPlaylist;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyPlaylistBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyPlaylist> get serializer => _$SpotifyPlaylistSerializer();
}

class _$SpotifyPlaylistSerializer implements PrimitiveSerializer<SpotifyPlaylist> {
  @override
  final Iterable<Type> types = const [SpotifyPlaylist, _$SpotifyPlaylist];

  @override
  final String wireName = r'SpotifyPlaylist';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyPlaylist object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'spotifyId';
    yield serializers.serialize(
      object.spotifyId,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.ownerName != null) {
      yield r'ownerName';
      yield serializers.serialize(
        object.ownerName,
        specifiedType: const FullType(String),
      );
    }
    if (object.coverUrl != null) {
      yield r'coverUrl';
      yield serializers.serialize(
        object.coverUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'totalTracks';
    yield serializers.serialize(
      object.totalTracks,
      specifiedType: const FullType(int),
    );
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
    );
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(SpotifyPlaylistSource_Enum),
    );
    yield r'limited';
    yield serializers.serialize(
      object.limited,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyPlaylist object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyPlaylistBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'spotifyId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.spotifyId = valueDes;
          break;
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
        case r'ownerName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.ownerName = valueDes;
          break;
        case r'coverUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.coverUrl = valueDes;
          break;
        case r'totalTracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalTracks = valueDes;
          break;
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
          ) as BuiltList<SpotifyTrack>;
          result.tracks.replace(valueDes);
          break;
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SpotifyPlaylistSource_Enum),
          ) as SpotifyPlaylistSource_Enum;
          result.source_ = valueDes;
          break;
        case r'limited':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.limited = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyPlaylist deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyPlaylistBuilder();
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


class SpotifyPlaylistSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'api')
  static const SpotifyPlaylistSource_Enum api = _$spotifyPlaylistSourceEnum_api;
  @BuiltValueEnumConst(wireName: r'embed')
  static const SpotifyPlaylistSource_Enum embed = _$spotifyPlaylistSourceEnum_embed;

  static Serializer<SpotifyPlaylistSource_Enum> get serializer => _$spotifyPlaylistSourceEnumSerializer;

  const SpotifyPlaylistSource_Enum._(String name): super(name);

  static BuiltSet<SpotifyPlaylistSource_Enum> get values => _$spotifyPlaylistSourceEnumValues;
  static SpotifyPlaylistSource_Enum valueOf(String name) => _$spotifyPlaylistSourceEnumValueOf(name);
}

