// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_track_list_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedTrackListEnvelopeData extends SavedTrackListEnvelopeData {
  @override
  final BuiltList<SavedTrack> items;

  factory _$SavedTrackListEnvelopeData(
          [void Function(SavedTrackListEnvelopeDataBuilder)? updates]) =>
      (SavedTrackListEnvelopeDataBuilder()..update(updates))._build();

  _$SavedTrackListEnvelopeData._({required this.items}) : super._();
  @override
  SavedTrackListEnvelopeData rebuild(
          void Function(SavedTrackListEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedTrackListEnvelopeDataBuilder toBuilder() =>
      SavedTrackListEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedTrackListEnvelopeData && items == other.items;
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
    return (newBuiltValueToStringHelper(r'SavedTrackListEnvelopeData')
          ..add('items', items))
        .toString();
  }
}

class SavedTrackListEnvelopeDataBuilder
    implements
        Builder<SavedTrackListEnvelopeData, SavedTrackListEnvelopeDataBuilder> {
  _$SavedTrackListEnvelopeData? _$v;

  ListBuilder<SavedTrack>? _items;
  ListBuilder<SavedTrack> get items =>
      _$this._items ??= ListBuilder<SavedTrack>();
  set items(ListBuilder<SavedTrack>? items) => _$this._items = items;

  SavedTrackListEnvelopeDataBuilder() {
    SavedTrackListEnvelopeData._defaults(this);
  }

  SavedTrackListEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedTrackListEnvelopeData other) {
    _$v = other as _$SavedTrackListEnvelopeData;
  }

  @override
  void update(void Function(SavedTrackListEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedTrackListEnvelopeData build() => _build();

  _$SavedTrackListEnvelopeData _build() {
    _$SavedTrackListEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$SavedTrackListEnvelopeData._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedTrackListEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
