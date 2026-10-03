// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_user_id.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerUserId extends DeezerUserId {
  @override
  final OneOf oneOf;

  factory _$DeezerUserId([void Function(DeezerUserIdBuilder)? updates]) =>
      (DeezerUserIdBuilder()..update(updates))._build();

  _$DeezerUserId._({required this.oneOf}) : super._();
  @override
  DeezerUserId rebuild(void Function(DeezerUserIdBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerUserIdBuilder toBuilder() => DeezerUserIdBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerUserId && oneOf == other.oneOf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oneOf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeezerUserId')..add('oneOf', oneOf))
        .toString();
  }
}

class DeezerUserIdBuilder
    implements Builder<DeezerUserId, DeezerUserIdBuilder> {
  _$DeezerUserId? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  DeezerUserIdBuilder() {
    DeezerUserId._defaults(this);
  }

  DeezerUserIdBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerUserId other) {
    _$v = other as _$DeezerUserId;
  }

  @override
  void update(void Function(DeezerUserIdBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerUserId build() => _build();

  _$DeezerUserId _build() {
    final _$result = _$v ??
        _$DeezerUserId._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
              oneOf, r'DeezerUserId', 'oneOf'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
