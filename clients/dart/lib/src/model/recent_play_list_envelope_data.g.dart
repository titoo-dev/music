// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recent_play_list_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentPlayListEnvelopeData extends RecentPlayListEnvelopeData {
  @override
  final BuiltList<RecentPlay> items;

  factory _$RecentPlayListEnvelopeData(
          [void Function(RecentPlayListEnvelopeDataBuilder)? updates]) =>
      (RecentPlayListEnvelopeDataBuilder()..update(updates))._build();

  _$RecentPlayListEnvelopeData._({required this.items}) : super._();
  @override
  RecentPlayListEnvelopeData rebuild(
          void Function(RecentPlayListEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecentPlayListEnvelopeDataBuilder toBuilder() =>
      RecentPlayListEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentPlayListEnvelopeData && items == other.items;
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
    return (newBuiltValueToStringHelper(r'RecentPlayListEnvelopeData')
          ..add('items', items))
        .toString();
  }
}

class RecentPlayListEnvelopeDataBuilder
    implements
        Builder<RecentPlayListEnvelopeData, RecentPlayListEnvelopeDataBuilder> {
  _$RecentPlayListEnvelopeData? _$v;

  ListBuilder<RecentPlay>? _items;
  ListBuilder<RecentPlay> get items =>
      _$this._items ??= ListBuilder<RecentPlay>();
  set items(ListBuilder<RecentPlay>? items) => _$this._items = items;

  RecentPlayListEnvelopeDataBuilder() {
    RecentPlayListEnvelopeData._defaults(this);
  }

  RecentPlayListEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentPlayListEnvelopeData other) {
    _$v = other as _$RecentPlayListEnvelopeData;
  }

  @override
  void update(void Function(RecentPlayListEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentPlayListEnvelopeData build() => _build();

  _$RecentPlayListEnvelopeData _build() {
    _$RecentPlayListEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$RecentPlayListEnvelopeData._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RecentPlayListEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
