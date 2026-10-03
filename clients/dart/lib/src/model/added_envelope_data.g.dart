// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'added_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AddedEnvelopeData extends AddedEnvelopeData {
  @override
  final int added;

  factory _$AddedEnvelopeData(
          [void Function(AddedEnvelopeDataBuilder)? updates]) =>
      (AddedEnvelopeDataBuilder()..update(updates))._build();

  _$AddedEnvelopeData._({required this.added}) : super._();
  @override
  AddedEnvelopeData rebuild(void Function(AddedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AddedEnvelopeDataBuilder toBuilder() =>
      AddedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AddedEnvelopeData && added == other.added;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, added.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AddedEnvelopeData')
          ..add('added', added))
        .toString();
  }
}

class AddedEnvelopeDataBuilder
    implements Builder<AddedEnvelopeData, AddedEnvelopeDataBuilder> {
  _$AddedEnvelopeData? _$v;

  int? _added;
  int? get added => _$this._added;
  set added(int? added) => _$this._added = added;

  AddedEnvelopeDataBuilder() {
    AddedEnvelopeData._defaults(this);
  }

  AddedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _added = $v.added;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AddedEnvelopeData other) {
    _$v = other as _$AddedEnvelopeData;
  }

  @override
  void update(void Function(AddedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AddedEnvelopeData build() => _build();

  _$AddedEnvelopeData _build() {
    final _$result = _$v ??
        _$AddedEnvelopeData._(
          added: BuiltValueNullFieldError.checkNotNull(
              added, r'AddedEnvelopeData', 'added'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
