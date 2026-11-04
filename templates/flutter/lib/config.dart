import 'package:flutter/material.dart';

/// App identity and the web app it wraps. Change these, not the shell code.
abstract final class AppConfig {
  static const name = 'Slipway';

  /// The deployed Slipway web app. Override per build:
  ///   flutter run --dart-define=APP_URL=https://app.example.com
  /// The Android emulator reaches this machine's dev server at 10.0.2.2.
  static const startUrl = String.fromEnvironment(
    'APP_URL',
    defaultValue: 'http://10.0.2.2:5173',
  );

  /// Hosts besides the start URL's that open inside the app: Kakao and Naver sign-in pages.
  /// Every other web address, and tel:, mailto: or app links, opens outside the app.
  static const inAppHosts = <String>{
    'kauth.kakao.com',
    'accounts.kakao.com',
    'logins.daum.net',
    'nid.naver.com',
  };

  /// Status bar and progress color. Matches --brand-h 262 in the web theme.
  static const brandColor = Color(0xFF3B5BDB);

  /// Appended to the browser user agent so the web app can tell it runs inside this shell.
  static const userAgentSuffix = 'SlipwayApp/1.0';
}
