// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'album_list_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AlbumListEnvelopeData extends AlbumListEnvelopeData {
  @override
  final BuiltList<Album> items;

  factory _$AlbumListEnvelopeData(
          [void Function(AlbumListEnvelopeDataBuilder)? updates]) =>
      (AlbumListEnvelopeDataBuilder()..update(updates))._build();

  _$AlbumListEnvelopeData._({required this.items}) : super._();
  @override
  AlbumListEnvelopeData rebuild(
          void Function(AlbumListEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AlbumListEnvelopeDataBuilder toBuilder() =>
      AlbumListEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AlbumListEnvelopeData && items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AlbumListEnvelopeData')
          ..add('items', items))
        .toString();
  }
}

class AlbumListEnvelopeDataBuilder
    implements Builder<AlbumListEnvelopeData, AlbumListEnvelopeDataBuilder> {
  _$AlbumListEnvelopeData? _$v;

  ListBuilder<Album>? _items;
  ListBuilder<Album> get items => _$this._items ??= ListBuilder<Album>();
  set items(ListBuilder<Album>? items) => _$this._items = items;

  AlbumListEnvelopeDataBuilder() {
    AlbumListEnvelopeData._defaults(this);
  }

  AlbumListEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AlbumListEnvelopeData other) {
    _$v = other as _$AlbumListEnvelopeData;
  }

  @override
  void update(void Function(AlbumListEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AlbumListEnvelopeData build() => _build();

  _$AlbumListEnvelopeData _build() {
    _$AlbumListEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$AlbumListEnvelopeData._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AlbumListEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
