// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'removed_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RemovedEnvelopeData extends RemovedEnvelopeData {
  @override
  final int removed;

  factory _$RemovedEnvelopeData(
          [void Function(RemovedEnvelopeDataBuilder)? updates]) =>
      (RemovedEnvelopeDataBuilder()..update(updates))._build();

  _$RemovedEnvelopeData._({required this.removed}) : super._();
  @override
  RemovedEnvelopeData rebuild(
          void Function(RemovedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RemovedEnvelopeDataBuilder toBuilder() =>
      RemovedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RemovedEnvelopeData && removed == other.removed;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, removed.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RemovedEnvelopeData')
          ..add('removed', removed))
        .toString();
  }
}

class RemovedEnvelopeDataBuilder
    implements Builder<RemovedEnvelopeData, RemovedEnvelopeDataBuilder> {
  _$RemovedEnvelopeData? _$v;

  int? _removed;
  int? get removed => _$this._removed;
  set removed(int? removed) => _$this._removed = removed;

  RemovedEnvelopeDataBuilder() {
    RemovedEnvelopeData._defaults(this);
  }

  RemovedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _removed = $v.removed;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RemovedEnvelopeData other) {
    _$v = other as _$RemovedEnvelopeData;
  }

  @override
  void update(void Function(RemovedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RemovedEnvelopeData build() => _build();

  _$RemovedEnvelopeData _build() {
    final _$result = _$v ??
        _$RemovedEnvelopeData._(
          removed: BuiltValueNullFieldError.checkNotNull(
              removed, r'RemovedEnvelopeData', 'removed'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
