// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'followed_artist.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowedArtist extends FollowedArtist {
  @override
  final String id;
  @override
  final String userId;
  @override
  final String deezerArtistId;
  @override
  final String name;
  @override
  final String? pictureUrl;
  @override
  final DateTime followedAt;

  factory _$FollowedArtist([void Function(FollowedArtistBuilder)? updates]) =>
      (FollowedArtistBuilder()..update(updates))._build();

  _$FollowedArtist._(
      {required this.id,
      required this.userId,
      required this.deezerArtistId,
      required this.name,
      this.pictureUrl,
      required this.followedAt})
      : super._();
  @override
  FollowedArtist rebuild(void Function(FollowedArtistBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowedArtistBuilder toBuilder() => FollowedArtistBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowedArtist &&
        id == other.id &&
        userId == other.userId &&
        deezerArtistId == other.deezerArtistId &&
        name == other.name &&
        pictureUrl == other.pictureUrl &&
        followedAt == other.followedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, deezerArtistId.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, pictureUrl.hashCode);
    _$hash = $jc(_$hash, followedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FollowedArtist')
          ..add('id', id)
          ..add('userId', userId)
          ..add('deezerArtistId', deezerArtistId)
          ..add('name', name)
          ..add('pictureUrl', pictureUrl)
          ..add('followedAt', followedAt))
        .toString();
  }
}

class FollowedArtistBuilder
    implements Builder<FollowedArtist, FollowedArtistBuilder> {
  _$FollowedArtist? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _deezerArtistId;
  String? get deezerArtistId => _$this._deezerArtistId;
  set deezerArtistId(String? deezerArtistId) =>
      _$this._deezerArtistId = deezerArtistId;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _pictureUrl;
  String? get pictureUrl => _$this._pictureUrl;
  set pictureUrl(String? pictureUrl) => _$this._pictureUrl = pictureUrl;

  DateTime? _followedAt;
  DateTime? get followedAt => _$this._followedAt;
  set followedAt(DateTime? followedAt) => _$this._followedAt = followedAt;

  FollowedArtistBuilder() {
    FollowedArtist._defaults(this);
  }

  FollowedArtistBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _deezerArtistId = $v.deezerArtistId;
      _name = $v.name;
      _pictureUrl = $v.pictureUrl;
      _followedAt = $v.followedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowedArtist other) {
    _$v = other as _$FollowedArtist;
  }

  @override
  void update(void Function(FollowedArtistBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowedArtist build() => _build();

  _$FollowedArtist _build() {
    final _$result = _$v ??
        _$FollowedArtist._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'FollowedArtist', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'FollowedArtist', 'userId'),
          deezerArtistId: BuiltValueNullFieldError.checkNotNull(
              deezerArtistId, r'FollowedArtist', 'deezerArtistId'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'FollowedArtist', 'name'),
          pictureUrl: pictureUrl,
          followedAt: BuiltValueNullFieldError.checkNotNull(
              followedAt, r'FollowedArtist', 'followedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
