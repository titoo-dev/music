//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'settings_bundle.g.dart';

/// SettingsBundle
///
/// Properties:
/// * [settings] - Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
/// * [defaultSettings] - Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
@BuiltValue()
abstract class SettingsBundle implements Built<SettingsBundle, SettingsBundleBuilder> {
  /// Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
  @BuiltValueField(wireName: r'settings')
  BuiltMap<String, JsonObject?> get settings;

  /// Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`.
  @BuiltValueField(wireName: r'defaultSettings')
  BuiltMap<String, JsonObject?> get defaultSettings;

  SettingsBundle._();

  factory SettingsBundle([void updates(SettingsBundleBuilder b)]) = _$SettingsBundle;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SettingsBundleBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SettingsBundle> get serializer => _$SettingsBundleSerializer();
}

class _$SettingsBundleSerializer implements PrimitiveSerializer<SettingsBundle> {
  @override
  final Iterable<Type> types = const [SettingsBundle, _$SettingsBundle];

  @override
  final String wireName = r'SettingsBundle';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SettingsBundle object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'settings';
    yield serializers.serialize(
      object.settings,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
    );
    yield r'defaultSettings';
    yield serializers.serialize(
      object.defaultSettings,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SettingsBundle object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SettingsBundleBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'settings':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.settings.replace(valueDes);
          break;
        case r'defaultSettings':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.defaultSettings.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SettingsBundle deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SettingsBundleBuilder();
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


