//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'spotify_import_report_not_found_inner.g.dart';

/// SpotifyImportReportNotFoundInner
///
/// Properties:
/// * [spotifyId] 
/// * [title] 
/// * [artist] 
/// * [album] 
/// * [reason] 
@BuiltValue()
abstract class SpotifyImportReportNotFoundInner implements Built<SpotifyImportReportNotFoundInner, SpotifyImportReportNotFoundInnerBuilder> {
  @BuiltValueField(wireName: r'spotifyId')
  String get spotifyId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'artist')
  String get artist;

  @BuiltValueField(wireName: r'album')
  String get album;

  @BuiltValueField(wireName: r'reason')
  String get reason;

  SpotifyImportReportNotFoundInner._();

  factory SpotifyImportReportNotFoundInner([void updates(SpotifyImportReportNotFoundInnerBuilder b)]) = _$SpotifyImportReportNotFoundInner;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SpotifyImportReportNotFoundInnerBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SpotifyImportReportNotFoundInner> get serializer => _$SpotifyImportReportNotFoundInnerSerializer();
}

class _$SpotifyImportReportNotFoundInnerSerializer implements PrimitiveSerializer<SpotifyImportReportNotFoundInner> {
  @override
  final Iterable<Type> types = const [SpotifyImportReportNotFoundInner, _$SpotifyImportReportNotFoundInner];

  @override
  final String wireName = r'SpotifyImportReportNotFoundInner';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SpotifyImportReportNotFoundInner object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'spotifyId';
    yield serializers.serialize(
      object.spotifyId,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'artist';
    yield serializers.serialize(
      object.artist,
      specifiedType: const FullType(String),
    );
    yield r'album';
    yield serializers.serialize(
      object.album,
      specifiedType: const FullType(String),
    );
    yield r'reason';
    yield serializers.serialize(
      object.reason,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SpotifyImportReportNotFoundInner object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SpotifyImportReportNotFoundInnerBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'spotifyId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.spotifyId = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'artist':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.artist = valueDes;
          break;
        case r'album':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.album = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SpotifyImportReportNotFoundInner deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SpotifyImportReportNotFoundInnerBuilder();
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


