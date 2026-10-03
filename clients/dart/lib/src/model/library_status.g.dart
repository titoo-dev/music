// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LibraryStatus extends LibraryStatus {
  @override
  final BuiltList<String> tracks;
  @override
  final BuiltList<String> albums;

  factory _$LibraryStatus([void Function(LibraryStatusBuilder)? updates]) =>
      (LibraryStatusBuilder()..update(updates))._build();

  _$LibraryStatus._({required this.tracks, required this.albums}) : super._();
  @override
  LibraryStatus rebuild(void Function(LibraryStatusBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryStatusBuilder toBuilder() => LibraryStatusBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryStatus &&
        tracks == other.tracks &&
        albums == other.albums;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, albums.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LibraryStatus')
          ..add('tracks', tracks)
          ..add('albums', albums))
        .toString();
  }
}

class LibraryStatusBuilder
    implements Builder<LibraryStatus, LibraryStatusBuilder> {
  _$LibraryStatus? _$v;

  ListBuilder<String>? _tracks;
  ListBuilder<String> get tracks => _$this._tracks ??= ListBuilder<String>();
  set tracks(ListBuilder<String>? tracks) => _$this._tracks = tracks;

  ListBuilder<String>? _albums;
  ListBuilder<String> get albums => _$this._albums ??= ListBuilder<String>();
  set albums(ListBuilder<String>? albums) => _$this._albums = albums;

  LibraryStatusBuilder() {
    LibraryStatus._defaults(this);
  }

  LibraryStatusBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _albums = $v.albums.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryStatus other) {
    _$v = other as _$LibraryStatus;
  }

  @override
  void update(void Function(LibraryStatusBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryStatus build() => _build();

  _$LibraryStatus _build() {
    _$LibraryStatus _$result;
    try {
      _$result = _$v ??
          _$LibraryStatus._(
            tracks: tracks.build(),
            albums: albums.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
        _$failedField = 'albums';
        albums.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LibraryStatus', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
