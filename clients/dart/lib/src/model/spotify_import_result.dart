//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/spotify_import_report.dart';
import 'package:wavelet_api/src/model/playlist.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_import_result.g.dart';

/// SpotifyImportResult
///
/// Properties:
/// * [playlist] - null when no track matched
/// * [report] 
@BuiltValue()
abstract class SpotifyImportResult implements Built<SpotifyImportResult, SpotifyImportResultBuilder> {
  /// null when no track matched
  @BuiltValueField(wireName: r'playlist')
  Playlist? get playlist;

  @BuiltValueField(wireName: r'report')
  SpotifyImportReport get report;

  SpotifyImportResult._();

  factory SpotifyImportResult([void updates(SpotifyImportResultBuilder b)]) = _$SpotifyImportResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyImportResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyImportResult> get serializer => _$SpotifyImportResultSerializer();
}

class _$SpotifyImportResultSerializer implements PrimitiveSerializer<SpotifyImportResult> {
  @override
  final Iterable<Type> types = const [SpotifyImportResult, _$SpotifyImportResult];

  @override
  final String wireName = r'SpotifyImportResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyImportResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'playlist';
    yield object.playlist == null ? null : serializers.serialize(
      object.playlist,
      specifiedType: const FullType.nullable(Playlist),
    );
    yield r'report';
    yield serializers.serialize(
      object.report,
      specifiedType: const FullType(SpotifyImportReport),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyImportResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyImportResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'playlist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(Playlist),
          ) as Playlist?;
          if (valueDes == null) continue;
          result.playlist = valueDes;
          break;
        case r'report':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SpotifyImportReport),
          ) as SpotifyImportReport;
          result.report.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyImportResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyImportResultBuilder();
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


