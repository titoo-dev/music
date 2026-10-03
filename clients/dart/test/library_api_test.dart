import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for LibraryApi
void main() {
  final instance = WaveletApi().getLibraryApi();

  group(LibraryApi, () {
    // Follow an artist (upsert)
    //
    //Future<FollowedArtistEnvelope> followArtist(FollowArtistInput followArtistInput) async
    test('test followArtist', () async {
      // TODO
    });

    // Batch: which of these tracks/albums are saved?
    //
    // Non-array `trackIds` / `albumIds` are silently treated as `[]`.
    //
    //Future<LibraryStatusEnvelope> getLibraryStatus(LibraryStatusInput libraryStatusInput) async
    test('test getLibraryStatus', () async {
      // TODO
    });

    // Saved album with tracklist
    //
    //Future<AlbumWithTracksEnvelope> getSavedAlbum(String albumId) async
    test('test getSavedAlbum', () async {
      // TODO
    });

    // Is this track liked?
    //
    //Future<SavedFlagEnvelope> isTrackSaved(String trackId) async
    test('test isTrackSaved', () async {
      // TODO
    });

    // Followed artists
    //
    //Future<FollowedArtistListEnvelope> listFollowedArtists() async
    test('test listFollowedArtists', () async {
      // TODO
    });

    // Saved albums
    //
    //Future<AlbumListEnvelope> listSavedAlbums() async
    test('test listSavedAlbums', () async {
      // TODO
    });

    // Liked tracks (most recent first)
    //
    //Future<SavedTrackListEnvelope> listSavedTracks({ int limit, int offset }) async
    test('test listSavedTracks', () async {
      // TODO
    });

    // Save an album with its tracklist (upsert, re-syncs tracks)
    //
    //Future<SavedAlbumEnvelope> saveAlbum(SaveAlbumInput saveAlbumInput) async
    test('test saveAlbum', () async {
      // TODO
    });

    // Like a track (upsert)
    //
    //Future<SavedTrackEnvelope> saveTrack(TrackMetaInput trackMetaInput) async
    test('test saveTrack', () async {
      // TODO
    });

    // Unfollow an artist (idempotent)
    //
    //Future<UnfollowedEnvelope> unfollowArtist(String deezerArtistId) async
    test('test unfollowArtist', () async {
      // TODO
    });

    // Remove a saved album
    //
    //Future<UnsavedEnvelope> unsaveAlbum(String albumId) async
    test('test unsaveAlbum', () async {
      // TODO
    });

    // Unlike a track (idempotent)
    //
    //Future<UnsavedEnvelope> unsaveTrack(String trackId) async
    test('test unsaveTrack', () async {
      // TODO
    });

  });
}
