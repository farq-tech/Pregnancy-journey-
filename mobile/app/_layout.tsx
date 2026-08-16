// Imported one weight per subpath rather than from the package root: the root
// index re-exports all 14 Rubik files, and Metro bundles every one it can reach
// — about 4 MB of italics this app never renders.
import { Rubik_400Regular } from '@expo-google-fonts/rubik/400Regular';
import { Rubik_500Medium } from '@expo-google-fonts/rubik/500Medium';
import { Rubik_600SemiBold } from '@expo-google-fonts/rubik/600SemiBold';
import { Rubik_700Bold } from '@expo-google-fonts/rubik/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { JourneyProvider } from '../src/store/JourneyProvider';
import { colors } from '../src/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    // Hold the splash until Rubik is ready — swapping the font mid-render would
    // reflow every Arabic line in the app.
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <JourneyProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          {/* Full-attention screens that push over the tab bar. */}
          <Stack.Screen name="track" />
          <Stack.Screen name="learn" />
          <Stack.Screen name="checklists" />
          <Stack.Screen name="letters" />
        </Stack>
      </JourneyProvider>
    </SafeAreaProvider>
  );
}
