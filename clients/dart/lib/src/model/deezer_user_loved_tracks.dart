//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'dart:core';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'deezer_user_loved_tracks.g.dart';

/// Loved-tracks playlist id (may be absent)
@BuiltValue()
abstract class DeezerUserLovedTracks implements Built<DeezerUserLovedTracks, DeezerUserLovedTracksBuilder> {
  /// One Of [String], [int]
  OneOf get oneOf;

  DeezerUserLovedTracks._();

  factory DeezerUserLovedTracks([void updates(DeezerUserLovedTracksBuilder b)]) = _$DeezerUserLovedTracks;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeezerUserLovedTracksBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeezerUserLovedTracks> get serializer => _$DeezerUserLovedTracksSerializer();
}

class _$DeezerUserLovedTracksSerializer implements PrimitiveSerializer<DeezerUserLovedTracks> {
  @override
  final Iterable<Type> types = const [DeezerUserLovedTracks, _$DeezerUserLovedTracks];

  @override
  final String wireName = r'DeezerUserLovedTracks';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeezerUserLovedTracks object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    DeezerUserLovedTracks object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  DeezerUserLovedTracks deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeezerUserLovedTracksBuilder();
    Object? oneOfDataSrc;
    final targetType = const FullType(OneOf, [FullType(int), FullType(String), ]);
    oneOfDataSrc = serialized;
    result.oneOf = serializers.deserialize(oneOfDataSrc, specifiedType: targetType) as OneOf;
    return result.build();
  }
}


