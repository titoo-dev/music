// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stream_probe.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StreamProbe extends StreamProbe {
  @override
  final bool ok;
  @override
  final bool cached;

  factory _$StreamProbe([void Function(StreamProbeBuilder)? updates]) =>
      (StreamProbeBuilder()..update(updates))._build();

  _$StreamProbe._({required this.ok, required this.cached}) : super._();
  @override
  StreamProbe rebuild(void Function(StreamProbeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamProbeBuilder toBuilder() => StreamProbeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamProbe && ok == other.ok && cached == other.cached;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ok.hashCode);
    _$hash = $jc(_$hash, cached.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StreamProbe')
          ..add('ok', ok)
          ..add('cached', cached))
        .toString();
  }
}

class StreamProbeBuilder implements Builder<StreamProbe, StreamProbeBuilder> {
  _$StreamProbe? _$v;

  bool? _ok;
  bool? get ok => _$this._ok;
  set ok(bool? ok) => _$this._ok = ok;

  bool? _cached;
  bool? get cached => _$this._cached;
  set cached(bool? cached) => _$this._cached = cached;

  StreamProbeBuilder() {
    StreamProbe._defaults(this);
  }

  StreamProbeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ok = $v.ok;
      _cached = $v.cached;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamProbe other) {
    _$v = other as _$StreamProbe;
  }

  @override
  void update(void Function(StreamProbeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamProbe build() => _build();

  _$StreamProbe _build() {
    final _$result = _$v ??
        _$StreamProbe._(
          ok: BuiltValueNullFieldError.checkNotNull(ok, r'StreamProbe', 'ok'),
          cached: BuiltValueNullFieldError.checkNotNull(
              cached, r'StreamProbe', 'cached'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
