// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_flag_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedFlagEnvelopeData extends SavedFlagEnvelopeData {
  @override
  final bool saved;

  factory _$SavedFlagEnvelopeData(
          [void Function(SavedFlagEnvelopeDataBuilder)? updates]) =>
      (SavedFlagEnvelopeDataBuilder()..update(updates))._build();

  _$SavedFlagEnvelopeData._({required this.saved}) : super._();
  @override
  SavedFlagEnvelopeData rebuild(
          void Function(SavedFlagEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedFlagEnvelopeDataBuilder toBuilder() =>
      SavedFlagEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedFlagEnvelopeData && saved == other.saved;
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
    return (newBuiltValueToStringHelper(r'SavedFlagEnvelopeData')
          ..add('saved', saved))
        .toString();
  }
}

class SavedFlagEnvelopeDataBuilder
    implements Builder<SavedFlagEnvelopeData, SavedFlagEnvelopeDataBuilder> {
  _$SavedFlagEnvelopeData? _$v;

  bool? _saved;
  bool? get saved => _$this._saved;
  set saved(bool? saved) => _$this._saved = saved;

  SavedFlagEnvelopeDataBuilder() {
    SavedFlagEnvelopeData._defaults(this);
  }

  SavedFlagEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _saved = $v.saved;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedFlagEnvelopeData other) {
    _$v = other as _$SavedFlagEnvelopeData;
  }

  @override
  void update(void Function(SavedFlagEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedFlagEnvelopeData build() => _build();

  _$SavedFlagEnvelopeData _build() {
    final _$result = _$v ??
        _$SavedFlagEnvelopeData._(
          saved: BuiltValueNullFieldError.checkNotNull(
              saved, r'SavedFlagEnvelopeData', 'saved'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
