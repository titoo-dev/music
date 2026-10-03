import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for DeezerAccountApi
void main() {
  final instance = WaveletApi().getDeezerAccountApi();

  group(DeezerAccountApi, () {
    // Switch to another Deezer family/child account
    //
    //Future<ChangeAccountEnvelope> changeDeezerAccount(ChangeDeezerAccountRequest changeDeezerAccountRequest) async
    test('test changeDeezerAccount', () async {
      // TODO
    });

    // Bootstrap: session + Deezer status + app settings
    //
    // Call at app start. Works without auth (guest). When signed in, restores the Deezer session from the stored ARL (or the server's service ARL, which is then persisted for the user).
    //
    //Future<ConnectStatusEnvelope> getConnectStatus() async
    test('test getConnectStatus', () async {
      // TODO
    });

    // Connect a Deezer account with an ARL cookie
    //
    //Future<DeezerLoginEnvelope> loginDeezerArl(LoginDeezerArlRequest loginDeezerArlRequest) async
    test('test loginDeezerArl', () async {
      // TODO
    });

    // Connect a Deezer account with email/password
    //
    //Future<DeezerLoginEnvelope> loginDeezerEmail(LoginDeezerEmailRequest loginDeezerEmailRequest) async
    test('test loginDeezerEmail', () async {
      // TODO
    });

    // Clear the in-memory Deezer session
    //
    // Does not delete the stored ARL nor the better-auth session (use `/api/auth/sign-out`).
    //
    //Future<MessageEnvelope> logoutDeezer() async
    test('test logoutDeezer', () async {
      // TODO
    });

  });
}
