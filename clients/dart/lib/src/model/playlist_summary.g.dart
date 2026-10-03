// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_summary.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistSummary extends PlaylistSummary {
  @override
  final PlaylistSummaryAllOfCount count;
  @override
  final bool? containsTrack;
  @override
  final BuiltList<String> covers;
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

  factory _$PlaylistSummary([void Function(PlaylistSummaryBuilder)? updates]) =>
      (PlaylistSummaryBuilder()..update(updates))._build();

  _$PlaylistSummary._(
      {required this.count,
      this.containsTrack,
      required this.covers,
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
  PlaylistSummary rebuild(void Function(PlaylistSummaryBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistSummaryBuilder toBuilder() => PlaylistSummaryBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistSummary &&
        count == other.count &&
        containsTrack == other.containsTrack &&
        covers == other.covers &&
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
    _$hash = $jc(_$hash, count.hashCode);
    _$hash = $jc(_$hash, containsTrack.hashCode);
    _$hash = $jc(_$hash, covers.hashCode);
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
    return (newBuiltValueToStringHelper(r'PlaylistSummary')
          ..add('count', count)
          ..add('containsTrack', containsTrack)
          ..add('covers', covers)
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

class PlaylistSummaryBuilder
    implements
        Builder<PlaylistSummary, PlaylistSummaryBuilder>,
        PlaylistBuilder {
  _$PlaylistSummary? _$v;

  PlaylistSummaryAllOfCountBuilder? _count;
  PlaylistSummaryAllOfCountBuilder get count =>
      _$this._count ??= PlaylistSummaryAllOfCountBuilder();
  set count(covariant PlaylistSummaryAllOfCountBuilder? count) =>
      _$this._count = count;

  bool? _containsTrack;
  bool? get containsTrack => _$this._containsTrack;
  set containsTrack(covariant bool? containsTrack) =>
      _$this._containsTrack = containsTrack;

  ListBuilder<String>? _covers;
  ListBuilder<String> get covers => _$this._covers ??= ListBuilder<String>();
  set covers(covariant ListBuilder<String>? covers) => _$this._covers = covers;

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

  PlaylistSummaryBuilder() {
    PlaylistSummary._defaults(this);
  }

  PlaylistSummaryBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _count = $v.count.toBuilder();
      _containsTrack = $v.containsTrack;
      _covers = $v.covers.toBuilder();
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
  void replace(covariant PlaylistSummary other) {
    _$v = other as _$PlaylistSummary;
  }

  @override
  void update(void Function(PlaylistSummaryBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistSummary build() => _build();

  _$PlaylistSummary _build() {
    _$PlaylistSummary _$result;
    try {
      _$result = _$v ??
          _$PlaylistSummary._(
            count: count.build(),
            containsTrack: containsTrack,
            covers: covers.build(),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'PlaylistSummary', 'id'),
            userId: BuiltValueNullFieldError.checkNotNull(
                userId, r'PlaylistSummary', 'userId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'PlaylistSummary', 'title'),
            description: description,
            coverUrl: coverUrl,
            isPublic: BuiltValueNullFieldError.checkNotNull(
                isPublic, r'PlaylistSummary', 'isPublic'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'PlaylistSummary', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'PlaylistSummary', 'updatedAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'count';
        count.build();

        _$failedField = 'covers';
        covers.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PlaylistSummary', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
