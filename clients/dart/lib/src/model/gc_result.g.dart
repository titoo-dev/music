// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gc_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GcResult extends GcResult {
  @override
  final bool ran;
  @override
  final String? reason;
  @override
  final int? rowsDeleted;
  @override
  final int? objectsDeleted;
  @override
  final int? objectsScanned;
  @override
  final int? orphanObjectsDeleted;
  @override
  final int? expiredSharesDeleted;

  factory _$GcResult([void Function(GcResultBuilder)? updates]) =>
      (GcResultBuilder()..update(updates))._build();

  _$GcResult._(
      {required this.ran,
      this.reason,
      this.rowsDeleted,
      this.objectsDeleted,
      this.objectsScanned,
      this.orphanObjectsDeleted,
      this.expiredSharesDeleted})
      : super._();
  @override
  GcResult rebuild(void Function(GcResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GcResultBuilder toBuilder() => GcResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GcResult &&
        ran == other.ran &&
        reason == other.reason &&
        rowsDeleted == other.rowsDeleted &&
        objectsDeleted == other.objectsDeleted &&
        objectsScanned == other.objectsScanned &&
        orphanObjectsDeleted == other.orphanObjectsDeleted &&
        expiredSharesDeleted == other.expiredSharesDeleted;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ran.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, rowsDeleted.hashCode);
    _$hash = $jc(_$hash, objectsDeleted.hashCode);
    _$hash = $jc(_$hash, objectsScanned.hashCode);
    _$hash = $jc(_$hash, orphanObjectsDeleted.hashCode);
    _$hash = $jc(_$hash, expiredSharesDeleted.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GcResult')
          ..add('ran', ran)
          ..add('reason', reason)
          ..add('rowsDeleted', rowsDeleted)
          ..add('objectsDeleted', objectsDeleted)
          ..add('objectsScanned', objectsScanned)
          ..add('orphanObjectsDeleted', orphanObjectsDeleted)
          ..add('expiredSharesDeleted', expiredSharesDeleted))
        .toString();
  }
}

class GcResultBuilder implements Builder<GcResult, GcResultBuilder> {
  _$GcResult? _$v;

  bool? _ran;
  bool? get ran => _$this._ran;
  set ran(bool? ran) => _$this._ran = ran;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  int? _rowsDeleted;
  int? get rowsDeleted => _$this._rowsDeleted;
  set rowsDeleted(int? rowsDeleted) => _$this._rowsDeleted = rowsDeleted;

  int? _objectsDeleted;
  int? get objectsDeleted => _$this._objectsDeleted;
  set objectsDeleted(int? objectsDeleted) =>
      _$this._objectsDeleted = objectsDeleted;

  int? _objectsScanned;
  int? get objectsScanned => _$this._objectsScanned;
  set objectsScanned(int? objectsScanned) =>
      _$this._objectsScanned = objectsScanned;

  int? _orphanObjectsDeleted;
  int? get orphanObjectsDeleted => _$this._orphanObjectsDeleted;
  set orphanObjectsDeleted(int? orphanObjectsDeleted) =>
      _$this._orphanObjectsDeleted = orphanObjectsDeleted;

  int? _expiredSharesDeleted;
  int? get expiredSharesDeleted => _$this._expiredSharesDeleted;
  set expiredSharesDeleted(int? expiredSharesDeleted) =>
      _$this._expiredSharesDeleted = expiredSharesDeleted;

  GcResultBuilder() {
    GcResult._defaults(this);
  }

  GcResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ran = $v.ran;
      _reason = $v.reason;
      _rowsDeleted = $v.rowsDeleted;
      _objectsDeleted = $v.objectsDeleted;
      _objectsScanned = $v.objectsScanned;
      _orphanObjectsDeleted = $v.orphanObjectsDeleted;
      _expiredSharesDeleted = $v.expiredSharesDeleted;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GcResult other) {
    _$v = other as _$GcResult;
  }

  @override
  void update(void Function(GcResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GcResult build() => _build();

  _$GcResult _build() {
    final _$result = _$v ??
        _$GcResult._(
          ran: BuiltValueNullFieldError.checkNotNull(ran, r'GcResult', 'ran'),
          reason: reason,
          rowsDeleted: rowsDeleted,
          objectsDeleted: objectsDeleted,
          objectsScanned: objectsScanned,
          orphanObjectsDeleted: orphanObjectsDeleted,
          expiredSharesDeleted: expiredSharesDeleted,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
