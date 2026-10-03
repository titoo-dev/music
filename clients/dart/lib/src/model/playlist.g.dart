// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class PlaylistBuilder {
  void replace(Playlist other);
  void update(void Function(PlaylistBuilder) updates);
  String? get id;
  set id(String? id);

  String? get userId;
  set userId(String? userId);

  String? get title;
  set title(String? title);

  String? get description;
  set description(String? description);

  String? get coverUrl;
  set coverUrl(String? coverUrl);

  bool? get isPublic;
  set isPublic(bool? isPublic);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);

  DateTime? get updatedAt;
  set updatedAt(DateTime? updatedAt);
}

class _$$Playlist extends $Playlist {
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

  factory _$$Playlist([void Function($PlaylistBuilder)? updates]) =>
      ($PlaylistBuilder()..update(updates))._build();

  _$$Playlist._(
      {required this.id,
      required this.userId,
      required this.title,
      this.description,
      this.coverUrl,
      required this.isPublic,
      required this.createdAt,
      required this.updatedAt})
      : super._();
  @override
  $Playlist rebuild(void Function($PlaylistBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $PlaylistBuilder toBuilder() => $PlaylistBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $Playlist &&
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
    return (newBuiltValueToStringHelper(r'$Playlist')
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

class $PlaylistBuilder
    implements Builder<$Playlist, $PlaylistBuilder>, PlaylistBuilder {
  _$$Playlist? _$v;

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

  $PlaylistBuilder() {
    $Playlist._defaults(this);
  }

  $PlaylistBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(covariant $Playlist other) {
    _$v = other as _$$Playlist;
  }

  @override
  void update(void Function($PlaylistBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $Playlist build() => _build();

  _$$Playlist _build() {
    final _$result = _$v ??
        _$$Playlist._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'$Playlist', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'$Playlist', 'userId'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'$Playlist', 'title'),
          description: description,
          coverUrl: coverUrl,
          isPublic: BuiltValueNullFieldError.checkNotNull(
              isPublic, r'$Playlist', 'isPublic'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'$Playlist', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'$Playlist', 'updatedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
