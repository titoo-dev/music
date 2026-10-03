// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'follow_artist_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowArtistInput extends FollowArtistInput {
  @override
  final String deezerArtistId;
  @override
  final String name;
  @override
  final String? pictureUrl;

  factory _$FollowArtistInput(
          [void Function(FollowArtistInputBuilder)? updates]) =>
      (FollowArtistInputBuilder()..update(updates))._build();

  _$FollowArtistInput._(
      {required this.deezerArtistId, required this.name, this.pictureUrl})
      : super._();
  @override
  FollowArtistInput rebuild(void Function(FollowArtistInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowArtistInputBuilder toBuilder() =>
      FollowArtistInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowArtistInput &&
        deezerArtistId == other.deezerArtistId &&
        name == other.name &&
        pictureUrl == other.pictureUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, deezerArtistId.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, pictureUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FollowArtistInput')
          ..add('deezerArtistId', deezerArtistId)
          ..add('name', name)
          ..add('pictureUrl', pictureUrl))
        .toString();
  }
}

class FollowArtistInputBuilder
    implements Builder<FollowArtistInput, FollowArtistInputBuilder> {
  _$FollowArtistInput? _$v;

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

  FollowArtistInputBuilder() {
    FollowArtistInput._defaults(this);
  }

  FollowArtistInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _deezerArtistId = $v.deezerArtistId;
      _name = $v.name;
      _pictureUrl = $v.pictureUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowArtistInput other) {
    _$v = other as _$FollowArtistInput;
  }

  @override
  void update(void Function(FollowArtistInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowArtistInput build() => _build();

  _$FollowArtistInput _build() {
    final _$result = _$v ??
        _$FollowArtistInput._(
          deezerArtistId: BuiltValueNullFieldError.checkNotNull(
              deezerArtistId, r'FollowArtistInput', 'deezerArtistId'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'FollowArtistInput', 'name'),
          pictureUrl: pictureUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
