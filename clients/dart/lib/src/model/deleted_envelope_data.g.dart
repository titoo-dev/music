// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deleted_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeletedEnvelopeData extends DeletedEnvelopeData {
  @override
  final bool deleted;

  factory _$DeletedEnvelopeData(
          [void Function(DeletedEnvelopeDataBuilder)? updates]) =>
      (DeletedEnvelopeDataBuilder()..update(updates))._build();

  _$DeletedEnvelopeData._({required this.deleted}) : super._();
  @override
  DeletedEnvelopeData rebuild(
          void Function(DeletedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeletedEnvelopeDataBuilder toBuilder() =>
      DeletedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeletedEnvelopeData && deleted == other.deleted;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, deleted.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeletedEnvelopeData')
          ..add('deleted', deleted))
        .toString();
  }
}

class DeletedEnvelopeDataBuilder
    implements Builder<DeletedEnvelopeData, DeletedEnvelopeDataBuilder> {
  _$DeletedEnvelopeData? _$v;

  bool? _deleted;
  bool? get deleted => _$this._deleted;
  set deleted(bool? deleted) => _$this._deleted = deleted;

  DeletedEnvelopeDataBuilder() {
    DeletedEnvelopeData._defaults(this);
  }

  DeletedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _deleted = $v.deleted;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeletedEnvelopeData other) {
    _$v = other as _$DeletedEnvelopeData;
  }

  @override
  void update(void Function(DeletedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeletedEnvelopeData build() => _build();

  _$DeletedEnvelopeData _build() {
    final _$result = _$v ??
        _$DeletedEnvelopeData._(
          deleted: BuiltValueNullFieldError.checkNotNull(
              deleted, r'DeletedEnvelopeData', 'deleted'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
