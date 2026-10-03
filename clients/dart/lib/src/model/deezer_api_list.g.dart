// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_api_list.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerApiList extends DeezerApiList {
  @override
  final BuiltList<BuiltMap<String, JsonObject?>>? data;
  @override
  final int? total;
  @override
  final String? next;
  @override
  final String? prev;

  factory _$DeezerApiList([void Function(DeezerApiListBuilder)? updates]) =>
      (DeezerApiListBuilder()..update(updates))._build();

  _$DeezerApiList._({this.data, this.total, this.next, this.prev}) : super._();
  @override
  DeezerApiList rebuild(void Function(DeezerApiListBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerApiListBuilder toBuilder() => DeezerApiListBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerApiList &&
        data == other.data &&
        total == other.total &&
        next == other.next &&
        prev == other.prev;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, next.hashCode);
    _$hash = $jc(_$hash, prev.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeezerApiList')
          ..add('data', data)
          ..add('total', total)
          ..add('next', next)
          ..add('prev', prev))
        .toString();
  }
}

class DeezerApiListBuilder
    implements Builder<DeezerApiList, DeezerApiListBuilder> {
  _$DeezerApiList? _$v;

  ListBuilder<BuiltMap<String, JsonObject?>>? _data;
  ListBuilder<BuiltMap<String, JsonObject?>> get data =>
      _$this._data ??= ListBuilder<BuiltMap<String, JsonObject?>>();
  set data(ListBuilder<BuiltMap<String, JsonObject?>>? data) =>
      _$this._data = data;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  String? _next;
  String? get next => _$this._next;
  set next(String? next) => _$this._next = next;

  String? _prev;
  String? get prev => _$this._prev;
  set prev(String? prev) => _$this._prev = prev;

  DeezerApiListBuilder() {
    DeezerApiList._defaults(this);
  }

  DeezerApiListBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data?.toBuilder();
      _total = $v.total;
      _next = $v.next;
      _prev = $v.prev;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerApiList other) {
    _$v = other as _$DeezerApiList;
  }

  @override
  void update(void Function(DeezerApiListBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerApiList build() => _build();

  _$DeezerApiList _build() {
    _$DeezerApiList _$result;
    try {
      _$result = _$v ??
          _$DeezerApiList._(
            data: _data?.build(),
            total: total,
            next: next,
            prev: prev,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        _data?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerApiList', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
