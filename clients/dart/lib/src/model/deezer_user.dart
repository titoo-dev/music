//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/deezer_user_loved_tracks.dart';
import 'package:wavelet_api/src/model/deezer_user_id.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'deezer_user.g.dart';

/// Deezer may send extra keys; they are ignored. `license_token` is never returned (it lets anyone request media as this account).
///
/// Properties:
/// * [id] 
/// * [name] 
/// * [picture] - Deezer picture hash (build URL via e-cdns-images.dzcdn.net/images/user/{hash}/...)
/// * [canStreamHq] 
/// * [canStreamLossless] 
/// * [country] 
/// * [language] 
/// * [lovedTracks] 
@BuiltValue()
abstract class DeezerUser implements Built<DeezerUser, DeezerUserBuilder> {
  @BuiltValueField(wireName: r'id')
  DeezerUserId? get id;

  @BuiltValueField(wireName: r'name')
  String? get name;

  /// Deezer picture hash (build URL via e-cdns-images.dzcdn.net/images/user/{hash}/...)
  @BuiltValueField(wireName: r'picture')
  String? get picture;

  @BuiltValueField(wireName: r'can_stream_hq')
  bool? get canStreamHq;

  @BuiltValueField(wireName: r'can_stream_lossless')
  bool? get canStreamLossless;

  @BuiltValueField(wireName: r'country')
  String? get country;

  @BuiltValueField(wireName: r'language')
  String? get language;

  @BuiltValueField(wireName: r'loved_tracks')
  DeezerUserLovedTracks? get lovedTracks;

  DeezerUser._();

  factory DeezerUser([void updates(DeezerUserBuilder b)]) = _$DeezerUser;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerUserBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerUser> get serializer => _$DeezerUserSerializer();
}

class _$DeezerUserSerializer implements PrimitiveSerializer<DeezerUser> {
  @override
  final Iterable<Type> types = const [DeezerUser, _$DeezerUser];

  @override
  final String wireName = r'DeezerUser';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerUser object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.id != null) {
      yield r'id';
      yield serializers.serialize(
        object.id,
        specifiedType: const FullType(DeezerUserId),
      );
    }
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    if (object.picture != null) {
      yield r'picture';
      yield serializers.serialize(
        object.picture,
        specifiedType: const FullType(String),
      );
    }
    if (object.canStreamHq != null) {
      yield r'can_stream_hq';
      yield serializers.serialize(
        object.canStreamHq,
        specifiedType: const FullType(bool),
      );
    }
    if (object.canStreamLossless != null) {
      yield r'can_stream_lossless';
      yield serializers.serialize(
        object.canStreamLossless,
        specifiedType: const FullType(bool),
      );
    }
    if (object.country != null) {
      yield r'country';
      yield serializers.serialize(
        object.country,
        specifiedType: const FullType(String),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(String),
      );
    }
    if (object.lovedTracks != null) {
      yield r'loved_tracks';
      yield serializers.serialize(
        object.lovedTracks,
        specifiedType: const FullType(DeezerUserLovedTracks),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerUser object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeezerUserBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DeezerUserId),
          ) as DeezerUserId?;
          if (valueDes == null) continue;
          result.id.replace(valueDes);
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.name = valueDes;
          break;
        case r'picture':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.picture = valueDes;
          break;
        case r'can_stream_hq':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.canStreamHq = valueDes;
          break;
        case r'can_stream_lossless':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.canStreamLossless = valueDes;
          break;
        case r'country':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.country = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.language = valueDes;
          break;
        case r'loved_tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DeezerUserLovedTracks),
          ) as DeezerUserLovedTracks?;
          if (valueDes == null) continue;
          result.lovedTracks.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeezerUser deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerUserBuilder();
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


