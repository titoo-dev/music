// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_import_report.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyImportReport extends SpotifyImportReport {
  @override
  final int totalSpotify;
  @override
  final int processed;
  @override
  final int matched;
  @override
  final BuiltList<SpotifyImportReportNotFoundInner> notFound;
  @override
  final bool truncated;
  @override
  final bool? limited;

  factory _$SpotifyImportReport(
          [void Function(SpotifyImportReportBuilder)? updates]) =>
      (SpotifyImportReportBuilder()..update(updates))._build();

  _$SpotifyImportReport._(
      {required this.totalSpotify,
      required this.processed,
      required this.matched,
      required this.notFound,
      required this.truncated,
      this.limited})
      : super._();
  @override
  SpotifyImportReport rebuild(
          void Function(SpotifyImportReportBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyImportReportBuilder toBuilder() =>
      SpotifyImportReportBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyImportReport &&
        totalSpotify == other.totalSpotify &&
        processed == other.processed &&
        matched == other.matched &&
        notFound == other.notFound &&
        truncated == other.truncated &&
        limited == other.limited;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, totalSpotify.hashCode);
    _$hash = $jc(_$hash, processed.hashCode);
    _$hash = $jc(_$hash, matched.hashCode);
    _$hash = $jc(_$hash, notFound.hashCode);
    _$hash = $jc(_$hash, truncated.hashCode);
    _$hash = $jc(_$hash, limited.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyImportReport')
          ..add('totalSpotify', totalSpotify)
          ..add('processed', processed)
          ..add('matched', matched)
          ..add('notFound', notFound)
          ..add('truncated', truncated)
          ..add('limited', limited))
        .toString();
  }
}

class SpotifyImportReportBuilder
    implements Builder<SpotifyImportReport, SpotifyImportReportBuilder> {
  _$SpotifyImportReport? _$v;

  int? _totalSpotify;
  int? get totalSpotify => _$this._totalSpotify;
  set totalSpotify(int? totalSpotify) => _$this._totalSpotify = totalSpotify;

  int? _processed;
  int? get processed => _$this._processed;
  set processed(int? processed) => _$this._processed = processed;

  int? _matched;
  int? get matched => _$this._matched;
  set matched(int? matched) => _$this._matched = matched;

  ListBuilder<SpotifyImportReportNotFoundInner>? _notFound;
  ListBuilder<SpotifyImportReportNotFoundInner> get notFound =>
      _$this._notFound ??= ListBuilder<SpotifyImportReportNotFoundInner>();
  set notFound(ListBuilder<SpotifyImportReportNotFoundInner>? notFound) =>
      _$this._notFound = notFound;

  bool? _truncated;
  bool? get truncated => _$this._truncated;
  set truncated(bool? truncated) => _$this._truncated = truncated;

  bool? _limited;
  bool? get limited => _$this._limited;
  set limited(bool? limited) => _$this._limited = limited;

  SpotifyImportReportBuilder() {
    SpotifyImportReport._defaults(this);
  }

  SpotifyImportReportBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _totalSpotify = $v.totalSpotify;
      _processed = $v.processed;
      _matched = $v.matched;
      _notFound = $v.notFound.toBuilder();
      _truncated = $v.truncated;
      _limited = $v.limited;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyImportReport other) {
    _$v = other as _$SpotifyImportReport;
  }

  @override
  void update(void Function(SpotifyImportReportBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyImportReport build() => _build();

  _$SpotifyImportReport _build() {
    _$SpotifyImportReport _$result;
    try {
      _$result = _$v ??
          _$SpotifyImportReport._(
            totalSpotify: BuiltValueNullFieldError.checkNotNull(
                totalSpotify, r'SpotifyImportReport', 'totalSpotify'),
            processed: BuiltValueNullFieldError.checkNotNull(
                processed, r'SpotifyImportReport', 'processed'),
            matched: BuiltValueNullFieldError.checkNotNull(
                matched, r'SpotifyImportReport', 'matched'),
            notFound: notFound.build(),
            truncated: BuiltValueNullFieldError.checkNotNull(
                truncated, r'SpotifyImportReport', 'truncated'),
            limited: limited,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'notFound';
        notFound.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyImportReport', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
