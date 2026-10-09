//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'gc_result.g.dart';

/// `{ ran: false, reason }` or `{ ran: true, rowsDeleted, objectsDeleted, objectsScanned, orphanObjectsDeleted, expiredSharesDeleted }`.
///
/// Properties:
/// * [ran] - false while `CRON_SECRET` is unset (no work done)
/// * [reason] - Only when `ran` is false
/// * [rowsDeleted] - Unreferenced StoredTrack rows deleted (only when `ran` is true)
/// * [objectsDeleted] - R2 objects of those rows deleted (only when `ran` is true)
/// * [objectsScanned] - Objects listed under `tracks/` (only when `ran` is true)
/// * [orphanObjectsDeleted] - Objects under `tracks/` without any row deleted (only when `ran` is true)
/// * [expiredSharesDeleted] - Share links expired for more than 30 days deleted (only when `ran` is true)
@BuiltValue()
abstract class GcResult implements Built<GcResult, GcResultBuilder> {
  /// false while `CRON_SECRET` is unset (no work done)
  @BuiltValueField(wireName: r'ran')
  bool get ran;

  /// Only when `ran` is false
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  /// Unreferenced StoredTrack rows deleted (only when `ran` is true)
  @BuiltValueField(wireName: r'rowsDeleted')
  int? get rowsDeleted;

  /// R2 objects of those rows deleted (only when `ran` is true)
  @BuiltValueField(wireName: r'objectsDeleted')
  int? get objectsDeleted;

  /// Objects listed under `tracks/` (only when `ran` is true)
  @BuiltValueField(wireName: r'objectsScanned')
  int? get objectsScanned;

  /// Objects under `tracks/` without any row deleted (only when `ran` is true)
  @BuiltValueField(wireName: r'orphanObjectsDeleted')
  int? get orphanObjectsDeleted;

  /// Share links expired for more than 30 days deleted (only when `ran` is true)
  @BuiltValueField(wireName: r'expiredSharesDeleted')
  int? get expiredSharesDeleted;

  GcResult._();

  factory GcResult([void updates(GcResultBuilder b)]) = _$GcResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GcResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GcResult> get serializer => _$GcResultSerializer();
}

class _$GcResultSerializer implements PrimitiveSerializer<GcResult> {
  @override
  final Iterable<Type> types = const [GcResult, _$GcResult];

  @override
  final String wireName = r'GcResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GcResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ran';
    yield serializers.serialize(
      object.ran,
      specifiedType: const FullType(bool),
    );
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType(String),
      );
    }
    if (object.rowsDeleted != null) {
      yield r'rowsDeleted';
      yield serializers.serialize(
        object.rowsDeleted,
        specifiedType: const FullType(int),
      );
    }
    if (object.objectsDeleted != null) {
      yield r'objectsDeleted';
      yield serializers.serialize(
        object.objectsDeleted,
        specifiedType: const FullType(int),
      );
    }
    if (object.objectsScanned != null) {
      yield r'objectsScanned';
      yield serializers.serialize(
        object.objectsScanned,
        specifiedType: const FullType(int),
      );
    }
    if (object.orphanObjectsDeleted != null) {
      yield r'orphanObjectsDeleted';
      yield serializers.serialize(
        object.orphanObjectsDeleted,
        specifiedType: const FullType(int),
      );
    }
    if (object.expiredSharesDeleted != null) {
      yield r'expiredSharesDeleted';
      yield serializers.serialize(
        object.expiredSharesDeleted,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    GcResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required GcResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ran':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.ran = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        case r'rowsDeleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.rowsDeleted = valueDes;
          break;
        case r'objectsDeleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.objectsDeleted = valueDes;
          break;
        case r'objectsScanned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.objectsScanned = valueDes;
          break;
        case r'orphanObjectsDeleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.orphanObjectsDeleted = valueDes;
          break;
        case r'expiredSharesDeleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.expiredSharesDeleted = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GcResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GcResultBuilder();
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


