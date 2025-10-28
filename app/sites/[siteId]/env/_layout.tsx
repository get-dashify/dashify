import { COLORS } from '@/theme/colors'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function DomainsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitle: true,
                headerTransparent: Platform.OS === 'ios',
                headerBlurEffect: isLiquidGlassAvailable() ? undefined : 'regular',
                headerLargeTitleStyle: {
                    color: COLORS.text,
                },
                headerTintColor: COLORS.text,
                headerStyle: isLiquidGlassAvailable()
                    ? undefined
                    : {
                          backgroundColor: COLORS.bgApp,
                      },
                contentStyle: {
                    backgroundColor: COLORS.bgApp,
                },
                title: 'Domains',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="add"
                options={{
                    title: 'New Variable',
                    headerLargeTitle: false,
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="[variableId]"
                options={{
                    title: 'Edit Variable',
                    headerLargeTitle: false,
                    presentation: 'modal',
                }}
            />
        </Stack>
    )
}
