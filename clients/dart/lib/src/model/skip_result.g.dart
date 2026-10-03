// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'skip_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SkipResultReasonEnum _$skipResultReasonEnum_alreadyPlayed =
    const SkipResultReasonEnum._('alreadyPlayed');
const SkipResultReasonEnum _$skipResultReasonEnum_anchored =
    const SkipResultReasonEnum._('anchored');

SkipResultReasonEnum _$skipResultReasonEnumValueOf(String name) {
  switch (name) {
    case 'alreadyPlayed':
      return _$skipResultReasonEnum_alreadyPlayed;
    case 'anchored':
      return _$skipResultReasonEnum_anchored;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SkipResultReasonEnum> _$skipResultReasonEnumValues =
    BuiltSet<SkipResultReasonEnum>(const <SkipResultReasonEnum>[
  _$skipResultReasonEnum_alreadyPlayed,
  _$skipResultReasonEnum_anchored,
]);

Serializer<SkipResultReasonEnum> _$skipResultReasonEnumSerializer =
    _$SkipResultReasonEnumSerializer();

class _$SkipResultReasonEnumSerializer
    implements PrimitiveSerializer<SkipResultReasonEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'alreadyPlayed': 'already_played',
    'anchored': 'anchored',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'already_played': 'alreadyPlayed',
    'anchored': 'anchored',
  };

  @override
  final Iterable<Type> types = const <Type>[SkipResultReasonEnum];
  @override
  final String wireName = 'SkipResultReasonEnum';

  @override
  Object serialize(Serializers serializers, SkipResultReasonEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SkipResultReasonEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SkipResultReasonEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SkipResult extends SkipResult {
  @override
  final bool? kept;
  @override
  final SkipResultReasonEnum? reason;
  @override
  final bool? evicted;

  factory _$SkipResult([void Function(SkipResultBuilder)? updates]) =>
      (SkipResultBuilder()..update(updates))._build();

  _$SkipResult._({this.kept, this.reason, this.evicted}) : super._();
  @override
  SkipResult rebuild(void Function(SkipResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SkipResultBuilder toBuilder() => SkipResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SkipResult &&
        kept == other.kept &&
        reason == other.reason &&
        evicted == other.evicted;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kept.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, evicted.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SkipResult')
          ..add('kept', kept)
          ..add('reason', reason)
          ..add('evicted', evicted))
        .toString();
  }
}

class SkipResultBuilder implements Builder<SkipResult, SkipResultBuilder> {
  _$SkipResult? _$v;

  bool? _kept;
  bool? get kept => _$this._kept;
  set kept(bool? kept) => _$this._kept = kept;

  SkipResultReasonEnum? _reason;
  SkipResultReasonEnum? get reason => _$this._reason;
  set reason(SkipResultReasonEnum? reason) => _$this._reason = reason;

  bool? _evicted;
  bool? get evicted => _$this._evicted;
  set evicted(bool? evicted) => _$this._evicted = evicted;

  SkipResultBuilder() {
    SkipResult._defaults(this);
  }

  SkipResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kept = $v.kept;
      _reason = $v.reason;
      _evicted = $v.evicted;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SkipResult other) {
    _$v = other as _$SkipResult;
  }

  @override
  void update(void Function(SkipResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SkipResult build() => _build();

  _$SkipResult _build() {
    final _$result = _$v ??
        _$SkipResult._(
          kept: kept,
          reason: reason,
          evicted: evicted,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
