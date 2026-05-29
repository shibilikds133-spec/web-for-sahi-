import { Stack } from 'expo-router';

export default function UnitDashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#030E21' }, // Light Blue background (Tailwind sky-50)
      }}
    />
  );
}
