// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'change_account_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ChangeAccountResult extends ChangeAccountResult {
  @override
  final DeezerUser user;
  @override
  final int selectedAccount;
  @override
  final BuiltList<DeezerUser> childs;

  factory _$ChangeAccountResult(
          [void Function(ChangeAccountResultBuilder)? updates]) =>
      (ChangeAccountResultBuilder()..update(updates))._build();

  _$ChangeAccountResult._(
      {required this.user, required this.selectedAccount, required this.childs})
      : super._();
  @override
  ChangeAccountResult rebuild(
          void Function(ChangeAccountResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ChangeAccountResultBuilder toBuilder() =>
      ChangeAccountResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ChangeAccountResult &&
        user == other.user &&
        selectedAccount == other.selectedAccount &&
        childs == other.childs;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jc(_$hash, selectedAccount.hashCode);
    _$hash = $jc(_$hash, childs.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ChangeAccountResult')
          ..add('user', user)
          ..add('selectedAccount', selectedAccount)
          ..add('childs', childs))
        .toString();
  }
}

class ChangeAccountResultBuilder
    implements Builder<ChangeAccountResult, ChangeAccountResultBuilder> {
  _$ChangeAccountResult? _$v;

  DeezerUserBuilder? _user;
  DeezerUserBuilder get user => _$this._user ??= DeezerUserBuilder();
  set user(DeezerUserBuilder? user) => _$this._user = user;

  int? _selectedAccount;
  int? get selectedAccount => _$this._selectedAccount;
  set selectedAccount(int? selectedAccount) =>
      _$this._selectedAccount = selectedAccount;

  ListBuilder<DeezerUser>? _childs;
  ListBuilder<DeezerUser> get childs =>
      _$this._childs ??= ListBuilder<DeezerUser>();
  set childs(ListBuilder<DeezerUser>? childs) => _$this._childs = childs;

  ChangeAccountResultBuilder() {
    ChangeAccountResult._defaults(this);
  }

  ChangeAccountResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _user = $v.user.toBuilder();
      _selectedAccount = $v.selectedAccount;
      _childs = $v.childs.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ChangeAccountResult other) {
    _$v = other as _$ChangeAccountResult;
  }

  @override
  void update(void Function(ChangeAccountResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ChangeAccountResult build() => _build();

  _$ChangeAccountResult _build() {
    _$ChangeAccountResult _$result;
    try {
      _$result = _$v ??
          _$ChangeAccountResult._(
            user: user.build(),
            selectedAccount: BuiltValueNullFieldError.checkNotNull(
                selectedAccount, r'ChangeAccountResult', 'selectedAccount'),
            childs: childs.build(),
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
            r'ChangeAccountResult', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
