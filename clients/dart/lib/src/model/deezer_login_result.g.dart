// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_login_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerLoginResult extends DeezerLoginResult {
  @override
  final DeezerUser user;
  @override
  final BuiltList<DeezerUser> childs;
  @override
  final int currentChild;
  @override
  final bool hasMultipleAccounts;

  factory _$DeezerLoginResult(
          [void Function(DeezerLoginResultBuilder)? updates]) =>
      (DeezerLoginResultBuilder()..update(updates))._build();

  _$DeezerLoginResult._(
      {required this.user,
      required this.childs,
      required this.currentChild,
      required this.hasMultipleAccounts})
      : super._();
  @override
  DeezerLoginResult rebuild(void Function(DeezerLoginResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerLoginResultBuilder toBuilder() =>
      DeezerLoginResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerLoginResult &&
        user == other.user &&
        childs == other.childs &&
        currentChild == other.currentChild &&
        hasMultipleAccounts == other.hasMultipleAccounts;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, childs.hashCode);
    _$hash = $jc(_$hash, currentChild.hashCode);
    _$hash = $jc(_$hash, hasMultipleAccounts.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeezerLoginResult')
          ..add('user', user)
          ..add('childs', childs)
          ..add('currentChild', currentChild)
          ..add('hasMultipleAccounts', hasMultipleAccounts))
        .toString();
  }
}

class DeezerLoginResultBuilder
    implements Builder<DeezerLoginResult, DeezerLoginResultBuilder> {
  _$DeezerLoginResult? _$v;

  DeezerUserBuilder? _user;
  DeezerUserBuilder get user => _$this._user ??= DeezerUserBuilder();
  set user(DeezerUserBuilder? user) => _$this._user = user;

  ListBuilder<DeezerUser>? _childs;
  ListBuilder<DeezerUser> get childs =>
      _$this._childs ??= ListBuilder<DeezerUser>();
  set childs(ListBuilder<DeezerUser>? childs) => _$this._childs = childs;

  int? _currentChild;
  int? get currentChild => _$this._currentChild;
  set currentChild(int? currentChild) => _$this._currentChild = currentChild;

  bool? _hasMultipleAccounts;
  bool? get hasMultipleAccounts => _$this._hasMultipleAccounts;
  set hasMultipleAccounts(bool? hasMultipleAccounts) =>
      _$this._hasMultipleAccounts = hasMultipleAccounts;

  DeezerLoginResultBuilder() {
    DeezerLoginResult._defaults(this);
  }

  DeezerLoginResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _user = $v.user.toBuilder();
      _childs = $v.childs.toBuilder();
      _currentChild = $v.currentChild;
      _hasMultipleAccounts = $v.hasMultipleAccounts;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerLoginResult other) {
    _$v = other as _$DeezerLoginResult;
  }

  @override
  void update(void Function(DeezerLoginResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerLoginResult build() => _build();

  _$DeezerLoginResult _build() {
    _$DeezerLoginResult _$result;
    try {
      _$result = _$v ??
          _$DeezerLoginResult._(
            user: user.build(),
            childs: childs.build(),
            currentChild: BuiltValueNullFieldError.checkNotNull(
                currentChild, r'DeezerLoginResult', 'currentChild'),
            hasMultipleAccounts: BuiltValueNullFieldError.checkNotNull(
                hasMultipleAccounts,
                r'DeezerLoginResult',
                'hasMultipleAccounts'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'user';
        user.build();
        _$failedField = 'childs';
        childs.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerLoginResult', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
