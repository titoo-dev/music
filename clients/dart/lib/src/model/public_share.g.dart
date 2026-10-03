// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_share.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PublicShare extends PublicShare {
  @override
  final String shareId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String? album;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final int plays;
  @override
  final DateTime createdAt;
  @override
  final DateTime? expiresAt;
  @override
  final PublicShareUser user;

  factory _$PublicShare([void Function(PublicShareBuilder)? updates]) =>
      (PublicShareBuilder()..update(updates))._build();

  _$PublicShare._(
      {required this.shareId,
      required this.title,
      required this.artist,
      this.album,
      this.coverUrl,
      this.duration,
      required this.plays,
      required this.createdAt,
      this.expiresAt,
      required this.user})
      : super._();
  @override
  PublicShare rebuild(void Function(PublicShareBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PublicShareBuilder toBuilder() => PublicShareBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PublicShare &&
        shareId == other.shareId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        plays == other.plays &&
        createdAt == other.createdAt &&
        expiresAt == other.expiresAt &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, shareId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, plays.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PublicShare')
          ..add('shareId', shareId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('plays', plays)
          ..add('createdAt', createdAt)
          ..add('expiresAt', expiresAt)
          ..add('user', user))
        .toString();
  }
}

class PublicShareBuilder implements Builder<PublicShare, PublicShareBuilder> {
  _$PublicShare? _$v;

  String? _shareId;
  String? get shareId => _$this._shareId;
  set shareId(String? shareId) => _$this._shareId = shareId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  int? _plays;
  int? get plays => _$this._plays;
  set plays(int? plays) => _$this._plays = plays;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  PublicShareUserBuilder? _user;
  PublicShareUserBuilder get user => _$this._user ??= PublicShareUserBuilder();
  set user(PublicShareUserBuilder? user) => _$this._user = user;

  PublicShareBuilder() {
    PublicShare._defaults(this);
  }

  PublicShareBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _shareId = $v.shareId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _plays = $v.plays;
      _createdAt = $v.createdAt;
      _expiresAt = $v.expiresAt;
      _user = $v.user.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PublicShare other) {
    _$v = other as _$PublicShare;
  }

  @override
  void update(void Function(PublicShareBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PublicShare build() => _build();

  _$PublicShare _build() {
    _$PublicShare _$result;
    try {
      _$result = _$v ??
          _$PublicShare._(
            shareId: BuiltValueNullFieldError.checkNotNull(
                shareId, r'PublicShare', 'shareId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'PublicShare', 'title'),
            artist: BuiltValueNullFieldError.checkNotNull(
                artist, r'PublicShare', 'artist'),
            album: album,
            coverUrl: coverUrl,
            duration: duration,
            plays: BuiltValueNullFieldError.checkNotNull(
                plays, r'PublicShare', 'plays'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'PublicShare', 'createdAt'),
            expiresAt: expiresAt,
            user: user.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        user.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PublicShare', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
