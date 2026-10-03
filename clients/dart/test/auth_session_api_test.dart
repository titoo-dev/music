import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for AuthSessionApi
void main() {
  final instance = WaveletApi().getAuthSessionApi();

  group(AuthSessionApi, () {
    // Current better-auth session
    //
    // Returns `null` (JSON) when no valid session cookie is sent.
    //
    //Future<BetterAuthSession> getSession() async
    test('test getSession', () async {
      // TODO
    });

    // Sign in with Google (better-auth)
    //
    // Managed by better-auth (not the `{ success, data }` envelope). For Flutter, use the **idToken** flow: get a Google ID token with `google_sign_in` (with the web client ID as `serverClientId`), POST it here, read the `set-auth-token` response header and send it as `Authorization: Bearer <token>` on every subsequent call.
    //
    //Future<SocialSignInResult> signInSocial(SocialSignInInput socialSignInInput) async
    test('test signInSocial', () async {
      // TODO
    });

    // Sign out (invalidate the session)
    //
    //Future<SignOut200Response> signOut({ JsonObject body }) async
    test('test signOut', () async {
      // TODO
    });

  });
}
