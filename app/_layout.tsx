import { queryClient } from '@/lib/query'
import { storage } from '@/lib/storage'
import { COLORS } from '@/theme/colors'
import * as Sentry from '@sentry/react-native'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { isRunningInExpoGo } from 'expo'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { activateKeepAwakeAsync } from 'expo-keep-awake'
import { useQuickActionRouting } from 'expo-quick-actions/router'
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router'
import { SuperwallProvider } from 'expo-superwall'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
})

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    // biome-ignore lint/correctness/noUndeclaredVariables: <>
    environment: __DEV__ ? 'development' : 'production',
    integrations: [navigationIntegration],
    enableNativeFramesTracking: !isRunningInExpoGo(),
})

const mmkvPersister = createSyncStoragePersister({
    storage: {
        getItem: (key) => {
            const value = storage.getString(key)
            return value ?? null
        },
        setItem: (key, value) => {
            storage.set(key, value)
        },
        removeItem: (key) => {
            storage.delete(key)
        },
    },
})

// const clearStorage = () => {
//     storage.clearAll()
//     queryClient.clear()
// }
// clearStorage()

function RootLayout() {
    const commonHeaderStyle = {
        headerTransparent: Platform.OS === 'ios',
        headerStyle: isLiquidGlassAvailable()
            ? undefined
            : {
                  backgroundColor: COLORS.bgApp,
              },
        headerTintColor: COLORS.text,
        headerShadowVisible: true,
        headerLargeTitleShadowVisible: false,
    }

    const commonContentStyle = {
        contentStyle: {
            backgroundColor: COLORS.bgApp,
        },
    }

    useQuickActionRouting()
    const ref = useNavigationContainerRef()

    useEffect(() => {
        if (ref?.current) {
            navigationIntegration.registerNavigationContainer(ref)
        }
    }, [ref])

    useEffect(() => {
        SplashScreen.hide()
        activateKeepAwakeAsync()
    }, [])

    return (
        <SafeAreaProvider>
            <SuperwallProvider
                apiKeys={{
                    ios: process.env.EXPO_PUBLIC_IOS_SUPERWALL_API_KEY,
                    android: process.env.EXPO_PUBLIC_ANDROID_SUPERWALL_API_KEY,
                }}
            >
                <GestureHandlerRootView>
                    <KeyboardProvider>
                        <PersistQueryClientProvider
                            client={queryClient}
                            persistOptions={{
                                persister: mmkvPersister,
                                dehydrateOptions: {
                                    shouldDehydrateQuery: (query) => query.state.data !== undefined,
                                },
                            }}
                        >
                            <Stack
                                screenOptions={{
                                    navigationBarHidden: true,
                                }}
                            >
                                <Stack.Screen
                                    name="onboard/index"
                                    options={{
                                        headerShown: false,
                                        gestureEnabled: false,
                                        animation: 'none',
                                    }}
                                />

                                <Stack.Screen
                                    name="login/index"
                                    options={{
                                        title: 'Login',
                                        headerShown: false,
                                        // gestureEnabled: false,
                                        // animation: 'none',
                                        presentation: 'modal',
                                        ...commonContentStyle,
                                        autoHideHomeIndicator: true,
                                    }}
                                />

                                <Stack.Screen
                                    name="home/index"
                                    options={{
                                        title: 'Home',
                                        headerShown: false,
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                        autoHideHomeIndicator: true,
                                    }}
                                />

                                <Stack.Screen
                                    name="notifications/index"
                                    options={{
                                        title: 'Notifications',
                                        headerShown: true,
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                    }}
                                />

                                <Stack.Screen
                                    name="forms/[formId]/index"
                                    options={{
                                        title: 'Submissions',
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                    }}
                                />

                                <Stack.Screen
                                    name="sites/all"
                                    options={{
                                        title: 'My Sites',
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                        presentation: 'modal',
                                    }}
                                />

                                <Stack.Screen
                                    name="sites/[siteId]"
                                    options={{
                                        title: 'Site',
                                        headerShown: false,
                                        animation: 'fade',
                                        animationDuration: 120,
                                        animationMatchesGesture: true,
                                        ...commonContentStyle,
                                    }}
                                />

                                <Stack.Screen
                                    name="deployments/[deploymentId]/index"
                                    options={{
                                        title: 'Deployment',
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                    }}
                                />

                                <Stack.Screen
                                    name="deployments/[deploymentId]/files"
                                    options={{
                                        title: 'Files',
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                    }}
                                />

                                <Stack.Screen
                                    name="deployments/[deploymentId]/logs"
                                    options={{
                                        title: 'Logs',
                                        ...commonHeaderStyle,
                                        ...commonContentStyle,
                                        autoHideHomeIndicator: true,
                                    }}
                                />
                            </Stack>
                        </PersistQueryClientProvider>
                    </KeyboardProvider>
                </GestureHandlerRootView>
            </SuperwallProvider>
        </SafeAreaProvider>
    )
}

export default RootLayout
