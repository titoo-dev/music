//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/spotify_import_report_not_found_inner.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_import_report.g.dart';

/// SpotifyImportReport
///
/// Properties:
/// * [totalSpotify] 
/// * [processed] 
/// * [matched] 
/// * [notFound] 
/// * [truncated] - true when the playlist had more than 1000 tracks
/// * [limited] - true when Spotify only exposed the first 100 tracks of a playlist link (paste track links for the full list)
@BuiltValue()
abstract class SpotifyImportReport implements Built<SpotifyImportReport, SpotifyImportReportBuilder> {
  @BuiltValueField(wireName: r'totalSpotify')
  int get totalSpotify;

  @BuiltValueField(wireName: r'processed')
  int get processed;

  @BuiltValueField(wireName: r'matched')
  int get matched;

  @BuiltValueField(wireName: r'notFound')
  BuiltList<SpotifyImportReportNotFoundInner> get notFound;

  /// true when the playlist had more than 1000 tracks
  @BuiltValueField(wireName: r'truncated')
  bool get truncated;

  /// true when Spotify only exposed the first 100 tracks of a playlist link (paste track links for the full list)
  @BuiltValueField(wireName: r'limited')
  bool? get limited;

  SpotifyImportReport._();

  factory SpotifyImportReport([void updates(SpotifyImportReportBuilder b)]) = _$SpotifyImportReport;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyImportReportBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyImportReport> get serializer => _$SpotifyImportReportSerializer();
}

class _$SpotifyImportReportSerializer implements PrimitiveSerializer<SpotifyImportReport> {
  @override
  final Iterable<Type> types = const [SpotifyImportReport, _$SpotifyImportReport];

  @override
  final String wireName = r'SpotifyImportReport';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyImportReport object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'totalSpotify';
    yield serializers.serialize(
      object.totalSpotify,
      specifiedType: const FullType(int),
    );
    yield r'processed';
    yield serializers.serialize(
      object.processed,
      specifiedType: const FullType(int),
    );
    yield r'matched';
    yield serializers.serialize(
      object.matched,
      specifiedType: const FullType(int),
    );
    yield r'notFound';
    yield serializers.serialize(
      object.notFound,
      specifiedType: const FullType(BuiltList, [FullType(SpotifyImportReportNotFoundInner)]),
    );
    yield r'truncated';
    yield serializers.serialize(
      object.truncated,
      specifiedType: const FullType(bool),
    );
    if (object.limited != null) {
      yield r'limited';
      yield serializers.serialize(
        object.limited,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyImportReport object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyImportReportBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'totalSpotify':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalSpotify = valueDes;
          break;
        case r'processed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.processed = valueDes;
          break;
        case r'matched':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.matched = valueDes;
          break;
        case r'notFound':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SpotifyImportReportNotFoundInner)]),
          ) as BuiltList<SpotifyImportReportNotFoundInner>;
          result.notFound.replace(valueDes);
          break;
        case r'truncated':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.truncated = valueDes;
          break;
        case r'limited':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.limited = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyImportReport deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyImportReportBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}


