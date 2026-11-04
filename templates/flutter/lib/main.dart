import 'package:flutter/material.dart';

import 'config.dart';
import 'shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(seedColor: AppConfig.brandColor);
    return MaterialApp(
      title: AppConfig.name,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorScheme: scheme),
      darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: AppConfig.brandColor, brightness: Brightness.dark)),
      home: const WebShell(),
    );
  }
}
