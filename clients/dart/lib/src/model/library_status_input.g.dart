// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_status_input.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LibraryStatusInput extends LibraryStatusInput {
  @override
  final BuiltList<String>? trackIds;
  @override
  final BuiltList<String>? albumIds;

  factory _$LibraryStatusInput(
          [void Function(LibraryStatusInputBuilder)? updates]) =>
      (LibraryStatusInputBuilder()..update(updates))._build();

  _$LibraryStatusInput._({this.trackIds, this.albumIds}) : super._();
  @override
  LibraryStatusInput rebuild(
          void Function(LibraryStatusInputBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryStatusInputBuilder toBuilder() =>
      LibraryStatusInputBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryStatusInput &&
        trackIds == other.trackIds &&
        albumIds == other.albumIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, trackIds.hashCode);
    _$hash = $jc(_$hash, albumIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LibraryStatusInput')
          ..add('trackIds', trackIds)
          ..add('albumIds', albumIds))
        .toString();
  }
}

class LibraryStatusInputBuilder
    implements Builder<LibraryStatusInput, LibraryStatusInputBuilder> {
  _$LibraryStatusInput? _$v;

  ListBuilder<String>? _trackIds;
  ListBuilder<String> get trackIds =>
      _$this._trackIds ??= ListBuilder<String>();
  set trackIds(ListBuilder<String>? trackIds) => _$this._trackIds = trackIds;

  ListBuilder<String>? _albumIds;
  ListBuilder<String> get albumIds =>
      _$this._albumIds ??= ListBuilder<String>();
  set albumIds(ListBuilder<String>? albumIds) => _$this._albumIds = albumIds;

  LibraryStatusInputBuilder() {
    LibraryStatusInput._defaults(this);
  }

  LibraryStatusInputBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _trackIds = $v.trackIds?.toBuilder();
      _albumIds = $v.albumIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryStatusInput other) {
    _$v = other as _$LibraryStatusInput;
  }

  @override
  void update(void Function(LibraryStatusInputBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryStatusInput build() => _build();

  _$LibraryStatusInput _build() {
    _$LibraryStatusInput _$result;
    try {
      _$result = _$v ??
          _$LibraryStatusInput._(
            trackIds: _trackIds?.build(),
            albumIds: _albumIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'trackIds';
        _trackIds?.build();
        _$failedField = 'albumIds';
        _albumIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LibraryStatusInput', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
