//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_track.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'import_spotify_playlist_request_one_of1.g.dart';

/// ImportSpotifyPlaylistRequestOneOf1
///
/// Properties:
/// * [tracks] - tracks read with POST /playlists/import/spotify/tracks
/// * [unreadable] - track ids that could not be read (reported as not found)
/// * [total] - number of pasted links, for the truncated flag
/// * [title] - name of the new playlist (default \"Spotify import\")
@BuiltValue()
abstract class ImportSpotifyPlaylistRequestOneOf1 implements Built<ImportSpotifyPlaylistRequestOneOf1, ImportSpotifyPlaylistRequestOneOf1Builder> {
  /// tracks read with POST /playlists/import/spotify/tracks
  @BuiltValueField(wireName: r'tracks')
  BuiltList<SpotifyTrack> get tracks;

  /// track ids that could not be read (reported as not found)
  @BuiltValueField(wireName: r'unreadable')
  BuiltList<String>? get unreadable;

  /// number of pasted links, for the truncated flag
  @BuiltValueField(wireName: r'total')
  int? get total;

  /// name of the new playlist (default \"Spotify import\")
  @BuiltValueField(wireName: r'title')
  String? get title;

  ImportSpotifyPlaylistRequestOneOf1._();

  factory ImportSpotifyPlaylistRequestOneOf1([void updates(ImportSpotifyPlaylistRequestOneOf1Builder b)]) = _$ImportSpotifyPlaylistRequestOneOf1;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportSpotifyPlaylistRequestOneOf1Builder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportSpotifyPlaylistRequestOneOf1> get serializer => _$ImportSpotifyPlaylistRequestOneOf1Serializer();
}

class _$ImportSpotifyPlaylistRequestOneOf1Serializer implements PrimitiveSerializer<ImportSpotifyPlaylistRequestOneOf1> {
  @override
  final Iterable<Type> types = const [ImportSpotifyPlaylistRequestOneOf1, _$ImportSpotifyPlaylistRequestOneOf1];

  @override
  final String wireName = r'ImportSpotifyPlaylistRequestOneOf1';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportSpotifyPlaylistRequestOneOf1 object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
    );
    if (object.unreadable != null) {
      yield r'unreadable';
      yield serializers.serialize(
        object.unreadable,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.total != null) {
      yield r'total';
      yield serializers.serialize(
        object.total,
        specifiedType: const FullType(int),
      );
    }
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ImportSpotifyPlaylistRequestOneOf1 object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ImportSpotifyPlaylistRequestOneOf1Builder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SpotifyTrack)]),
          ) as BuiltList<SpotifyTrack>;
          result.tracks.replace(valueDes);
          break;
        case r'unreadable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltList, [FullType(String)]),
          ) as BuiltList<String>?;
          if (valueDes == null) continue;
          result.unreadable.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.total = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.title = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ImportSpotifyPlaylistRequestOneOf1 deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportSpotifyPlaylistRequestOneOf1Builder();
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


