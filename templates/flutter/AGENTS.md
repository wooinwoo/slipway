# Slipway Flutter

A Flutter shell that ships a Slipway web app (react, next or mono preset) to Android and iOS. The app is
the web app in a web view, plus what a phone app needs around it. It has no screens of its own; build
screens in the web app.

## Commands

- `flutter run --dart-define=APP_URL=http://10.0.2.2:5173` runs on the Android emulator against the web
  dev server on this machine (iOS simulator: `http://localhost:5173`).
- `flutter analyze && flutter test` checks the shell. Run both before reporting a task as done.
- `flutter build apk --dart-define=APP_URL=https://app.example.com` / `flutter build ipa ...` for release.

## Map

| Path | What lives there |
|---|---|
| `lib/config.dart` | App name, start URL (`APP_URL`), hosts that stay in the app, brand color, user agent suffix |
| `lib/shell.dart` | The web view: back button, progress bar, offline screen, outside links, file uploads, bridge |
| `lib/navigation.dart` | Which links stay inside, open outside, or never load. Tested in `test/` |
| `lib/bridge.dart` | Messages from the web app (`window.SlipwayApp.postMessage`). Tested in `test/` |
| `android/`, `ios/` | Platform projects. Names, permissions and http rules for local development |

## The web app side

The shell adds `SlipwayApp/1.0` to the user agent and a `window.SlipwayApp` channel:

```ts
const inApp = typeof (window as any).SlipwayApp !== "undefined"
const send = (message: object) => (window as any).SlipwayApp?.postMessage(JSON.stringify(message))
send({ type: "share", text: "주문 A-1042", url: location.href })   // system share sheet
send({ type: "haptic" })                                           // light vibration
send({ type: "openExternal", url: "https://example.org/terms" })   // phone browser
```

Kakao and Naver sign-in pages stay inside the app (`inAppHosts`), so the OAuth round trip returns to
the web app's `/auth/callback`. Any other site, `tel:`, `mailto:` and app links open outside.

## Rules

- Change behavior in `lib/navigation.dart` and `lib/bridge.dart` with a test; keep `shell.dart` thin.
- New bridge messages: add a case to `BridgeMessage.parse`, handle it in `_onBridge`, test both.
  Never add a message that runs arbitrary code or reads files.
- Release builds load https only. Set `APP_URL` per build; never ship the 10.0.2.2 default.
- The launcher icon is Flutter's default until the user supplies the product's icon. Never draw one;
  generate the sizes from the supplied file with `flutter_launcher_icons`.
- Before a store release, change the application id (`android/app/build.gradle.kts`: `namespace`,
  `applicationId`, and the `MainActivity.kt` package) and the iOS bundle id (Xcode, Runner target).
