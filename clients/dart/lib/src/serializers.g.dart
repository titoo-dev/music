// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (Serializers().toBuilder()
      ..add($Album.serializer)
      ..add($Playlist.serializer)
      ..add(AddPlaylistTracksRequest.serializer)
      ..add(AddedEnvelope.serializer)
      ..add(AddedEnvelopeData.serializer)
      ..add(AlbumListEnvelope.serializer)
      ..add(AlbumListEnvelopeData.serializer)
      ..add(AlbumTrack.serializer)
      ..add(AlbumTrackInput.serializer)
      ..add(AlbumWithTracks.serializer)
      ..add(AlbumWithTracksEnvelope.serializer)
      ..add(AuthUser.serializer)
      ..add(BetterAuthSession.serializer)
      ..add(BetterAuthSessionSession.serializer)
      ..add(BetterAuthUser.serializer)
      ..add(ChangeAccountEnvelope.serializer)
      ..add(ChangeAccountResult.serializer)
      ..add(ChangeDeezerAccountRequest.serializer)
      ..add(ConnectStatus.serializer)
      ..add(ConnectStatusDeezerAvailableEnum.serializer)
      ..add(ConnectStatusEnvelope.serializer)
      ..add(CreatePlaylistInput.serializer)
      ..add(CreateShareInput.serializer)
      ..add(DeezerApiList.serializer)
      ..add(DeezerApiListEnvelope.serializer)
      ..add(DeezerLoginEnvelope.serializer)
      ..add(DeezerLoginResult.serializer)
      ..add(DeezerPageEnvelope.serializer)
      ..add(DeezerSearchMainEnvelope.serializer)
      ..add(DeezerTracklistEnvelope.serializer)
      ..add(DeezerUser.serializer)
      ..add(DeezerUserId.serializer)
      ..add(DeezerUserLovedTracks.serializer)
      ..add(DeletedEnvelope.serializer)
      ..add(DeletedEnvelopeData.serializer)
      ..add(ErrorResponse.serializer)
      ..add(ErrorResponseError.serializer)
      ..add(FollowArtistInput.serializer)
      ..add(FollowedArtist.serializer)
      ..add(FollowedArtistEnvelope.serializer)
      ..add(FollowedArtistEnvelopeData.serializer)
      ..add(FollowedArtistListEnvelope.serializer)
      ..add(FollowedArtistListEnvelopeData.serializer)
      ..add(GcEnvelope.serializer)
      ..add(GcResult.serializer)
      ..add(ImportSpotifyPlaylistRequest.serializer)
      ..add(ImportSpotifyPlaylistRequestOneOf.serializer)
      ..add(ImportSpotifyPlaylistRequestOneOf1.serializer)
      ..add(ImportedTrack.serializer)
      ..add(LibraryStatus.serializer)
      ..add(LibraryStatusEnvelope.serializer)
      ..add(LibraryStatusInput.serializer)
      ..add(LoggedEnvelope.serializer)
      ..add(LoggedEnvelopeData.serializer)
      ..add(LoginDeezerArlRequest.serializer)
      ..add(LoginDeezerEmailRequest.serializer)
      ..add(Lyrics.serializer)
      ..add(LyricsEnvelope.serializer)
      ..add(LyricsSource_Enum.serializer)
      ..add(MatchSpotifyTracksRequest.serializer)
      ..add(MessageEnvelope.serializer)
      ..add(MessageResult.serializer)
      ..add(PlaylistEnvelope.serializer)
      ..add(PlaylistSummary.serializer)
      ..add(PlaylistSummaryAllOfCount.serializer)
      ..add(PlaylistSummaryListEnvelope.serializer)
      ..add(PlaylistTrack.serializer)
      ..add(PlaylistTrackInput.serializer)
      ..add(PlaylistWithTracks.serializer)
      ..add(PlaylistWithTracksEnvelope.serializer)
      ..add(PublicShare.serializer)
      ..add(PublicShareEnvelope.serializer)
      ..add(PublicShareUser.serializer)
      ..add(ReadSpotifyPlaylistRequest.serializer)
      ..add(ReadSpotifyTracksRequest.serializer)
      ..add(RecentPlay.serializer)
      ..add(RecentPlayInput.serializer)
      ..add(RecentPlayListEnvelope.serializer)
      ..add(RecentPlayListEnvelopeData.serializer)
      ..add(RemovePlaylistTracksRequest.serializer)
      ..add(RemovedEnvelope.serializer)
      ..add(RemovedEnvelopeData.serializer)
      ..add(ReorderPlaylistTracksRequest.serializer)
      ..add(ReorderedEnvelope.serializer)
      ..add(ReorderedEnvelopeData.serializer)
      ..add(SaveAlbumInput.serializer)
      ..add(SaveSettingsRequest.serializer)
      ..add(SaveSpotifyImportRequest.serializer)
      ..add(SavedAlbumEnvelope.serializer)
      ..add(SavedAlbumEnvelopeData.serializer)
      ..add(SavedFlagEnvelope.serializer)
      ..add(SavedFlagEnvelopeData.serializer)
      ..add(SavedTrack.serializer)
      ..add(SavedTrackEnvelope.serializer)
      ..add(SavedTrackEnvelopeData.serializer)
      ..add(SavedTrackListEnvelope.serializer)
      ..add(SavedTrackListEnvelopeData.serializer)
      ..add(SetStreamingQualityRequest.serializer)
      ..add(SetStreamingQualityRequestMaxBitrateEnum.serializer)
      ..add(SettingsBundle.serializer)
      ..add(SettingsBundleEnvelope.serializer)
      ..add(SharedTrack.serializer)
      ..add(SharedTrackEnvelope.serializer)
      ..add(SharedTrackListEnvelope.serializer)
      ..add(SignOut200Response.serializer)
      ..add(SkipEnvelope.serializer)
      ..add(SkipResult.serializer)
      ..add(SkipResultReasonEnum.serializer)
      ..add(SocialSignInInput.serializer)
      ..add(SocialSignInInputIdToken.serializer)
      ..add(SocialSignInInputProviderEnum.serializer)
      ..add(SocialSignInResult.serializer)
      ..add(SpotifyImportEnvelope.serializer)
      ..add(SpotifyImportReport.serializer)
      ..add(SpotifyImportReportNotFoundInner.serializer)
      ..add(SpotifyImportResult.serializer)
      ..add(SpotifyMatchEnvelope.serializer)
      ..add(SpotifyMatchEnvelopeData.serializer)
      ..add(SpotifyMatchResult.serializer)
      ..add(SpotifyMatchResultStatusEnum.serializer)
      ..add(SpotifyMatchResultStrategyEnum.serializer)
      ..add(SpotifyPlaylist.serializer)
      ..add(SpotifyPlaylistEnvelope.serializer)
      ..add(SpotifyPlaylistSource_Enum.serializer)
      ..add(SpotifySaveEnvelope.serializer)
      ..add(SpotifySaveEnvelopeData.serializer)
      ..add(SpotifyTrack.serializer)
      ..add(SpotifyTrackBatch.serializer)
      ..add(SpotifyTrackBatchEnvelope.serializer)
      ..add(StreamProbe.serializer)
      ..add(StreamProbeEnvelope.serializer)
      ..add(StreamUrl.serializer)
      ..add(StreamUrlEnvelope.serializer)
      ..add(StreamUrlStatusEnum.serializer)
      ..add(StreamingQualityEnvelope.serializer)
      ..add(SuggestAlbum.serializer)
      ..add(SuggestAlbumSource_Enum.serializer)
      ..add(SuggestArtist.serializer)
      ..add(SuggestArtistSource_Enum.serializer)
      ..add(SuggestTrack.serializer)
      ..add(SuggestTrackSource_Enum.serializer)
      ..add(Suggestions.serializer)
      ..add(SuggestionsEnvelope.serializer)
      ..add(SuggestionsSource_Enum.serializer)
      ..add(TrackMetaInput.serializer)
      ..add(UnfollowedEnvelope.serializer)
      ..add(UnfollowedEnvelopeData.serializer)
      ..add(UnsavedEnvelope.serializer)
      ..add(UnsavedEnvelopeData.serializer)
      ..add(UpdatePlaylistInput.serializer)
      ..add(UserPreferences.serializer)
      ..add(UserPreferencesAlbumSortOrderEnum.serializer)
      ..add(UserPreferencesEnvelope.serializer)
      ..add(UserPreferencesPlaylistSortOrderEnum.serializer)
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Album)]),
          () => ListBuilder<Album>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AlbumTrack)]),
          () => ListBuilder<AlbumTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AlbumTrackInput)]),
          () => ListBuilder<AlbumTrackInput>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [
            const FullType(BuiltMap, const [
              const FullType(String),
              const FullType.nullable(JsonObject)
            ])
          ]),
          () => ListBuilder<BuiltMap<String, JsonObject?>>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(DeezerUser)]),
          () => ListBuilder<DeezerUser>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(DeezerUser)]),
          () => ListBuilder<DeezerUser>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(FollowedArtist)]),
          () => ListBuilder<FollowedArtist>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ImportedTrack)]),
          () => ListBuilder<ImportedTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PlaylistSummary)]),
          () => ListBuilder<PlaylistSummary>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PlaylistTrack)]),
          () => ListBuilder<PlaylistTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PlaylistTrackInput)]),
          () => ListBuilder<PlaylistTrackInput>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(RecentPlay)]),
          () => ListBuilder<RecentPlay>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SavedTrack)]),
          () => ListBuilder<SavedTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SharedTrack)]),
          () => ListBuilder<SharedTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList,
              const [const FullType(SpotifyImportReportNotFoundInner)]),
          () => ListBuilder<SpotifyImportReportNotFoundInner>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SpotifyMatchResult)]),
          () => ListBuilder<SpotifyMatchResult>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SpotifyTrack)]),
          () => ListBuilder<SpotifyTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SpotifyTrack)]),
          () => ListBuilder<SpotifyTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SpotifyTrack)]),
          () => ListBuilder<SpotifyTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SpotifyTrack)]),
          () => ListBuilder<SpotifyTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SuggestTrack)]),
          () => ListBuilder<SuggestTrack>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SuggestAlbum)]),
          () => ListBuilder<SuggestAlbum>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(SuggestArtist)]),
          () => ListBuilder<SuggestArtist>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>())
      ..addBuilderFactory(
          const FullType(BuiltMap, const [
            const FullType(String),
            const FullType.nullable(JsonObject)
          ]),
          () => MapBuilder<String, JsonObject?>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
