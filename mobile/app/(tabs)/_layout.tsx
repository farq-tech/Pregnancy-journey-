import { Redirect } from 'expo-router';
// expo-router 57 deprecates the `Tabs` re-export from the package root.
import { Tabs } from 'expo-router/js-tabs';
import { ActivityIndicator, View } from 'react-native';

import { TabBar } from '../../src/components/TabBar';
import { useJourney } from '../../src/store/JourneyProvider';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const { loading, settings } = useJourney();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  // No LMP on file yet: there is no journey to show, so onboarding comes first.
  if (!settings?.lmp) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="baby" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="records" />
    </Tabs>
  );
}
