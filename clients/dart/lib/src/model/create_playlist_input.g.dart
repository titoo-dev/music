// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_playlist_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreatePlaylistInput extends CreatePlaylistInput {
  @override
  final String title;
  @override
  final String? description;

  factory _$CreatePlaylistInput(
          [void Function(CreatePlaylistInputBuilder)? updates]) =>
      (CreatePlaylistInputBuilder()..update(updates))._build();

  _$CreatePlaylistInput._({required this.title, this.description}) : super._();
  @override
  CreatePlaylistInput rebuild(
          void Function(CreatePlaylistInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreatePlaylistInputBuilder toBuilder() =>
      CreatePlaylistInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreatePlaylistInput &&
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
    return (newBuiltValueToStringHelper(r'CreatePlaylistInput')
          ..add('title', title)
          ..add('description', description))
        .toString();
  }
}

class CreatePlaylistInputBuilder
    implements Builder<CreatePlaylistInput, CreatePlaylistInputBuilder> {
  _$CreatePlaylistInput? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  CreatePlaylistInputBuilder() {
    CreatePlaylistInput._defaults(this);
  }

  CreatePlaylistInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreatePlaylistInput other) {
    _$v = other as _$CreatePlaylistInput;
  }

  @override
  void update(void Function(CreatePlaylistInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreatePlaylistInput build() => _build();

  _$CreatePlaylistInput _build() {
    final _$result = _$v ??
        _$CreatePlaylistInput._(
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'CreatePlaylistInput', 'title'),
          description: description,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
