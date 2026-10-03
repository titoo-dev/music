// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_album_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedAlbumEnvelopeData extends SavedAlbumEnvelopeData {
  @override
  final Album saved;

  factory _$SavedAlbumEnvelopeData(
          [void Function(SavedAlbumEnvelopeDataBuilder)? updates]) =>
      (SavedAlbumEnvelopeDataBuilder()..update(updates))._build();

  _$SavedAlbumEnvelopeData._({required this.saved}) : super._();
  @override
  SavedAlbumEnvelopeData rebuild(
          void Function(SavedAlbumEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedAlbumEnvelopeDataBuilder toBuilder() =>
      SavedAlbumEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedAlbumEnvelopeData && saved == other.saved;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, saved.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SavedAlbumEnvelopeData')
          ..add('saved', saved))
        .toString();
  }
}

class SavedAlbumEnvelopeDataBuilder
    implements Builder<SavedAlbumEnvelopeData, SavedAlbumEnvelopeDataBuilder> {
  _$SavedAlbumEnvelopeData? _$v;

  Album? _saved;
  Album? get saved => _$this._saved;
  set saved(Album? saved) => _$this._saved = saved;

  SavedAlbumEnvelopeDataBuilder() {
    SavedAlbumEnvelopeData._defaults(this);
  }

  SavedAlbumEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _saved = $v.saved;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedAlbumEnvelopeData other) {
    _$v = other as _$SavedAlbumEnvelopeData;
  }

  @override
  void update(void Function(SavedAlbumEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedAlbumEnvelopeData build() => _build();

  _$SavedAlbumEnvelopeData _build() {
    final _$result = _$v ??
        _$SavedAlbumEnvelopeData._(
          saved: BuiltValueNullFieldError.checkNotNull(
              saved, r'SavedAlbumEnvelopeData', 'saved'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
