// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'followed_artist_list_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FollowedArtistListEnvelopeData extends FollowedArtistListEnvelopeData {
  @override
  final BuiltList<FollowedArtist> items;

  factory _$FollowedArtistListEnvelopeData(
          [void Function(FollowedArtistListEnvelopeDataBuilder)? updates]) =>
      (FollowedArtistListEnvelopeDataBuilder()..update(updates))._build();

  _$FollowedArtistListEnvelopeData._({required this.items}) : super._();
  @override
  FollowedArtistListEnvelopeData rebuild(
          void Function(FollowedArtistListEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FollowedArtistListEnvelopeDataBuilder toBuilder() =>
      FollowedArtistListEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FollowedArtistListEnvelopeData && items == other.items;
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
    return (newBuiltValueToStringHelper(r'FollowedArtistListEnvelopeData')
          ..add('items', items))
        .toString();
  }
}

class FollowedArtistListEnvelopeDataBuilder
    implements
        Builder<FollowedArtistListEnvelopeData,
            FollowedArtistListEnvelopeDataBuilder> {
  _$FollowedArtistListEnvelopeData? _$v;

  ListBuilder<FollowedArtist>? _items;
  ListBuilder<FollowedArtist> get items =>
      _$this._items ??= ListBuilder<FollowedArtist>();
  set items(ListBuilder<FollowedArtist>? items) => _$this._items = items;

  FollowedArtistListEnvelopeDataBuilder() {
    FollowedArtistListEnvelopeData._defaults(this);
  }

  FollowedArtistListEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FollowedArtistListEnvelopeData other) {
    _$v = other as _$FollowedArtistListEnvelopeData;
  }

  @override
  void update(void Function(FollowedArtistListEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FollowedArtistListEnvelopeData build() => _build();

  _$FollowedArtistListEnvelopeData _build() {
    _$FollowedArtistListEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$FollowedArtistListEnvelopeData._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FollowedArtistListEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
