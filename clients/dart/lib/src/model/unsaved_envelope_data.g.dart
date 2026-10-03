// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unsaved_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UnsavedEnvelopeData extends UnsavedEnvelopeData {
  @override
  final bool unsaved;

  factory _$UnsavedEnvelopeData(
          [void Function(UnsavedEnvelopeDataBuilder)? updates]) =>
      (UnsavedEnvelopeDataBuilder()..update(updates))._build();

  _$UnsavedEnvelopeData._({required this.unsaved}) : super._();
  @override
  UnsavedEnvelopeData rebuild(
          void Function(UnsavedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UnsavedEnvelopeDataBuilder toBuilder() =>
      UnsavedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UnsavedEnvelopeData && unsaved == other.unsaved;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, unsaved.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UnsavedEnvelopeData')
          ..add('unsaved', unsaved))
        .toString();
  }
}

class UnsavedEnvelopeDataBuilder
    implements Builder<UnsavedEnvelopeData, UnsavedEnvelopeDataBuilder> {
  _$UnsavedEnvelopeData? _$v;

  bool? _unsaved;
  bool? get unsaved => _$this._unsaved;
  set unsaved(bool? unsaved) => _$this._unsaved = unsaved;

  UnsavedEnvelopeDataBuilder() {
    UnsavedEnvelopeData._defaults(this);
  }

  UnsavedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _unsaved = $v.unsaved;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UnsavedEnvelopeData other) {
    _$v = other as _$UnsavedEnvelopeData;
  }

  @override
  void update(void Function(UnsavedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UnsavedEnvelopeData build() => _build();

  _$UnsavedEnvelopeData _build() {
    final _$result = _$v ??
        _$UnsavedEnvelopeData._(
          unsaved: BuiltValueNullFieldError.checkNotNull(
              unsaved, r'UnsavedEnvelopeData', 'unsaved'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
