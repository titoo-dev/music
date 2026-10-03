// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_track_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedTrackEnvelopeData extends SavedTrackEnvelopeData {
  @override
  final SavedTrack saved;

  factory _$SavedTrackEnvelopeData(
          [void Function(SavedTrackEnvelopeDataBuilder)? updates]) =>
      (SavedTrackEnvelopeDataBuilder()..update(updates))._build();

  _$SavedTrackEnvelopeData._({required this.saved}) : super._();
  @override
  SavedTrackEnvelopeData rebuild(
          void Function(SavedTrackEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedTrackEnvelopeDataBuilder toBuilder() =>
      SavedTrackEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedTrackEnvelopeData && saved == other.saved;
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
    return (newBuiltValueToStringHelper(r'SavedTrackEnvelopeData')
          ..add('saved', saved))
        .toString();
  }
}

class SavedTrackEnvelopeDataBuilder
    implements Builder<SavedTrackEnvelopeData, SavedTrackEnvelopeDataBuilder> {
  _$SavedTrackEnvelopeData? _$v;

  SavedTrackBuilder? _saved;
  SavedTrackBuilder get saved => _$this._saved ??= SavedTrackBuilder();
  set saved(SavedTrackBuilder? saved) => _$this._saved = saved;

  SavedTrackEnvelopeDataBuilder() {
    SavedTrackEnvelopeData._defaults(this);
  }

  SavedTrackEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _saved = $v.saved.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedTrackEnvelopeData other) {
    _$v = other as _$SavedTrackEnvelopeData;
  }

  @override
  void update(void Function(SavedTrackEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedTrackEnvelopeData build() => _build();

  _$SavedTrackEnvelopeData _build() {
    _$SavedTrackEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$SavedTrackEnvelopeData._(
            saved: saved.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'saved';
        saved.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedTrackEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
