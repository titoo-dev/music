// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reordered_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReorderedEnvelopeData extends ReorderedEnvelopeData {
  @override
  final int reordered;

  factory _$ReorderedEnvelopeData(
          [void Function(ReorderedEnvelopeDataBuilder)? updates]) =>
      (ReorderedEnvelopeDataBuilder()..update(updates))._build();

  _$ReorderedEnvelopeData._({required this.reordered}) : super._();
  @override
  ReorderedEnvelopeData rebuild(
          void Function(ReorderedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReorderedEnvelopeDataBuilder toBuilder() =>
      ReorderedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReorderedEnvelopeData && reordered == other.reordered;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, reordered.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReorderedEnvelopeData')
          ..add('reordered', reordered))
        .toString();
  }
}

class ReorderedEnvelopeDataBuilder
    implements Builder<ReorderedEnvelopeData, ReorderedEnvelopeDataBuilder> {
  _$ReorderedEnvelopeData? _$v;

  int? _reordered;
  int? get reordered => _$this._reordered;
  set reordered(int? reordered) => _$this._reordered = reordered;

  ReorderedEnvelopeDataBuilder() {
    ReorderedEnvelopeData._defaults(this);
  }

  ReorderedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _reordered = $v.reordered;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReorderedEnvelopeData other) {
    _$v = other as _$ReorderedEnvelopeData;
  }

  @override
  void update(void Function(ReorderedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReorderedEnvelopeData build() => _build();

  _$ReorderedEnvelopeData _build() {
    final _$result = _$v ??
        _$ReorderedEnvelopeData._(
          reordered: BuiltValueNullFieldError.checkNotNull(
              reordered, r'ReorderedEnvelopeData', 'reordered'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
