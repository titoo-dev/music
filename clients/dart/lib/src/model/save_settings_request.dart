//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'save_settings_request.g.dart';

/// SaveSettingsRequest
///
/// Properties:
/// * [settings] - Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
/// * [spotifySettings] - Spotify plugin settings
@BuiltValue()
abstract class SaveSettingsRequest implements Built<SaveSettingsRequest, SaveSettingsRequestBuilder> {
  /// Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
  @BuiltValueField(wireName: r'settings')
  BuiltMap<String, JsonObject?>? get settings;

  /// Spotify plugin settings
  @BuiltValueField(wireName: r'spotifySettings')
  BuiltMap<String, JsonObject?>? get spotifySettings;

  SaveSettingsRequest._();

  factory SaveSettingsRequest([void updates(SaveSettingsRequestBuilder b)]) = _$SaveSettingsRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SaveSettingsRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SaveSettingsRequest> get serializer => _$SaveSettingsRequestSerializer();
}

class _$SaveSettingsRequestSerializer implements PrimitiveSerializer<SaveSettingsRequest> {
  @override
  final Iterable<Type> types = const [SaveSettingsRequest, _$SaveSettingsRequest];

  @override
  final String wireName = r'SaveSettingsRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SaveSettingsRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.settings != null) {
      yield r'settings';
      yield serializers.serialize(
        object.settings,
        specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
    if (object.spotifySettings != null) {
      yield r'spotifySettings';
      yield serializers.serialize(
        object.spotifySettings,
        specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SaveSettingsRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SaveSettingsRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'settings':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>?;
          if (valueDes == null) continue;
          result.settings.replace(valueDes);
          break;
        case r'spotifySettings':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>?;
          if (valueDes == null) continue;
          result.spotifySettings.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SaveSettingsRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SaveSettingsRequestBuilder();
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


