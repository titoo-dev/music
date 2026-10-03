// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_with_tracks.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistWithTracks extends PlaylistWithTracks {
  @override
  final BuiltList<PlaylistTrack> tracks;
  @override
  final String id;
  @override
  final String userId;
  @override
  final String title;
  @override
  final String? description;
  @override
  final String? coverUrl;
  @override
  final bool isPublic;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$PlaylistWithTracks(
          [void Function(PlaylistWithTracksBuilder)? updates]) =>
      (PlaylistWithTracksBuilder()..update(updates))._build();

  _$PlaylistWithTracks._(
      {required this.tracks,
      required this.id,
      required this.userId,
      required this.title,
      this.description,
      this.coverUrl,
      required this.isPublic,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  PlaylistWithTracks rebuild(
          void Function(PlaylistWithTracksBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistWithTracksBuilder toBuilder() =>
      PlaylistWithTracksBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistWithTracks &&
        tracks == other.tracks &&
        id == other.id &&
        userId == other.userId &&
        title == other.title &&
        description == other.description &&
        coverUrl == other.coverUrl &&
        isPublic == other.isPublic &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, isPublic.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PlaylistWithTracks')
          ..add('tracks', tracks)
          ..add('id', id)
          ..add('userId', userId)
          ..add('title', title)
          ..add('description', description)
          ..add('coverUrl', coverUrl)
          ..add('isPublic', isPublic)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class PlaylistWithTracksBuilder
    implements
        Builder<PlaylistWithTracks, PlaylistWithTracksBuilder>,
        PlaylistBuilder {
  _$PlaylistWithTracks? _$v;

  ListBuilder<PlaylistTrack>? _tracks;
  ListBuilder<PlaylistTrack> get tracks =>
      _$this._tracks ??= ListBuilder<PlaylistTrack>();
  set tracks(covariant ListBuilder<PlaylistTrack>? tracks) =>
      _$this._tracks = tracks;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(covariant String? userId) => _$this._userId = userId;

  String? _title;
  String? get title => _$this._title;
  set title(covariant String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(covariant String? description) =>
      _$this._description = description;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(covariant String? coverUrl) => _$this._coverUrl = coverUrl;

  bool? _isPublic;
  bool? get isPublic => _$this._isPublic;
  set isPublic(covariant bool? isPublic) => _$this._isPublic = isPublic;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(covariant DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  PlaylistWithTracksBuilder() {
    PlaylistWithTracks._defaults(this);
  }

  PlaylistWithTracksBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _id = $v.id;
      _userId = $v.userId;
      _title = $v.title;
      _description = $v.description;
      _coverUrl = $v.coverUrl;
      _isPublic = $v.isPublic;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant PlaylistWithTracks other) {
    _$v = other as _$PlaylistWithTracks;
  }

  @override
  void update(void Function(PlaylistWithTracksBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistWithTracks build() => _build();

  _$PlaylistWithTracks _build() {
    _$PlaylistWithTracks _$result;
    try {
      _$result = _$v ??
          _$PlaylistWithTracks._(
            tracks: tracks.build(),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'PlaylistWithTracks', 'id'),
            userId: BuiltValueNullFieldError.checkNotNull(
                userId, r'PlaylistWithTracks', 'userId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'PlaylistWithTracks', 'title'),
            description: description,
            coverUrl: coverUrl,
            isPublic: BuiltValueNullFieldError.checkNotNull(
                isPublic, r'PlaylistWithTracks', 'isPublic'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'PlaylistWithTracks', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'PlaylistWithTracks', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PlaylistWithTracks', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
