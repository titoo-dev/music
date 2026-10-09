//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/import_spotify_playlist_request_one_of1.dart';
import 'package:wavelet_api/src/model/spotify_track.dart';
import 'package:wavelet_api/src/model/import_spotify_playlist_request_one_of.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'import_spotify_playlist_request.g.dart';

/// ImportSpotifyPlaylistRequest
///
/// Properties:
/// * [url] - Spotify playlist URL, URI or id (first 100 tracks without API access)
/// * [tracks] - tracks read with POST /playlists/import/spotify/tracks
/// * [unreadable] - track ids that could not be read (reported as not found)
/// * [total] - number of pasted links, for the truncated flag
/// * [title] - name of the new playlist (default \"Spotify import\")
@BuiltValue()
abstract class ImportSpotifyPlaylistRequest implements Built<ImportSpotifyPlaylistRequest, ImportSpotifyPlaylistRequestBuilder> {
  /// One Of [ImportSpotifyPlaylistRequestOneOf], [ImportSpotifyPlaylistRequestOneOf1]
  OneOf get oneOf;

  ImportSpotifyPlaylistRequest._();

  factory ImportSpotifyPlaylistRequest([void updates(ImportSpotifyPlaylistRequestBuilder b)]) = _$ImportSpotifyPlaylistRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportSpotifyPlaylistRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportSpotifyPlaylistRequest> get serializer => _$ImportSpotifyPlaylistRequestSerializer();
}

class _$ImportSpotifyPlaylistRequestSerializer implements PrimitiveSerializer<ImportSpotifyPlaylistRequest> {
  @override
  final Iterable<Type> types = const [ImportSpotifyPlaylistRequest, _$ImportSpotifyPlaylistRequest];

  @override
  final String wireName = r'ImportSpotifyPlaylistRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportSpotifyPlaylistRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    ImportSpotifyPlaylistRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  ImportSpotifyPlaylistRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportSpotifyPlaylistRequestBuilder();
    Object? oneOfDataSrc;
    final targetType = const FullType(OneOf, [FullType(ImportSpotifyPlaylistRequestOneOf), FullType(ImportSpotifyPlaylistRequestOneOf1), ]);
    oneOfDataSrc = serialized;
    result.oneOf = serializers.deserialize(oneOfDataSrc, specifiedType: targetType) as OneOf;
    return result.build();
  }
}


