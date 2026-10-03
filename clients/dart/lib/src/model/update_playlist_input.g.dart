// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_playlist_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdatePlaylistInput extends UpdatePlaylistInput {
  @override
  final String? title;
  @override
  final String? description;

  factory _$UpdatePlaylistInput(
          [void Function(UpdatePlaylistInputBuilder)? updates]) =>
      (UpdatePlaylistInputBuilder()..update(updates))._build();

  _$UpdatePlaylistInput._({this.title, this.description}) : super._();
  @override
  UpdatePlaylistInput rebuild(
          void Function(UpdatePlaylistInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdatePlaylistInputBuilder toBuilder() =>
      UpdatePlaylistInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdatePlaylistInput &&
        title == other.title &&
        description == other.description;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdatePlaylistInput')
          ..add('title', title)
          ..add('description', description))
        .toString();
  }
}

class UpdatePlaylistInputBuilder
    implements Builder<UpdatePlaylistInput, UpdatePlaylistInputBuilder> {
  _$UpdatePlaylistInput? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  UpdatePlaylistInputBuilder() {
    UpdatePlaylistInput._defaults(this);
  }

  UpdatePlaylistInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdatePlaylistInput other) {
    _$v = other as _$UpdatePlaylistInput;
  }

  @override
  void update(void Function(UpdatePlaylistInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdatePlaylistInput build() => _build();

  _$UpdatePlaylistInput _build() {
    final _$result = _$v ??
        _$UpdatePlaylistInput._(
          title: title,
          description: description,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
