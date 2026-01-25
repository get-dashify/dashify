//  https://docs.expo.dev/workflow/configuration/#switching-configuration-based-on-the-environment
//  https://docs.expo.dev/versions/latest/config/app/#backgroundcolor
//  https://docs.expo.dev/versions/latest/config/app/#primarycolor

module.exports = ({ config }) => {
    return {
        ...config,
        primaryColor: '#12181F',
        backgroundColor: '#12181F',

        name: process.env.EXPO_PUBLIC_APP_NAME,
        slug: process.env.EXPO_PUBLIC_APP_SLUG,
        scheme: process.env.EXPO_PUBLIC_APP_SCHEME,
        version: process.env.EXPO_PUBLIC_APP_VERSION,
        owner: process.env.EXPO_PUBLIC_OWNER,

        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        newArchEnabled: true,

        ios: {
            ...(config.ios || {}),
            appleTeamId: process.env.EXPO_PUBLIC_APPLE_TEAM_ID,
            bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER,
            supportsTablet: true,
            config: {
                usesNonExemptEncryption: false,
            },
            infoPlist: {
                SKIncludeConsumableInAppPurchaseHistory: true,
            },
            entitlements: {
                'com.apple.security.application-groups': [process.env.EXPO_PUBLIC_WIDGET_GROUP],
            },
        },

        androidNavigationBar: {
            enforceContrast: false,
        },
        android: {
            ...(config.android || {}),
            package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
            adaptiveIcon: {
                foregroundImage: './assets/icon.png',
                backgroundColor: '#12181F',
            },
            googleServicesFile: './google-services.json',
            playStoreUrl: process.env.EXPO_PUBLIC_ANDROID_STORE_URL,
            predictiveBackGestureEnabled: false,
        },

        plugins: [
            [
                'expo-build-properties',
                {
                    'android': {
                        'minSdkVersion': 26,
                    },
                },
            ],
            './plugins/withAndroidHeap',
            'expo-router',
            [
                'expo-splash-screen',
                {
                    image: './assets/icon.png',
                    resizeMode: 'contain',
                    backgroundColor: '#12181F',
                    imageWidth: 200,
                },
            ],
            '@bacons/apple-targets',
            'expo-quick-actions',
            [
                '@sentry/react-native/expo',
                {
                    url: 'https://sentry.io/',
                    project: process.env.EXPO_PUBLIC_SENTRY_PROJECT,
                    organization: process.env.EXPO_PUBLIC_SENTRY_ORG,
                },
            ],
            [
                './plugins/withAndroidWidget',
                {
                    src: './targets/widget-android',
                    versions: {
                        glance: '1.1.1',
                        kotlinExtension: '2.0.0',
                        gson: '2.13.2',
                        activityCompose: '1.11.0',
                        composeUi: '1.9.3',
                        material3: '1.4.0',
                        workRuntime: '2.10.5',
                    },
                    widgets: [
                        {
                            receiverName: 'SmallShortcutWidgetReceiver',
                            configurationActivity: 'SmallShortcutConfigurationActivity',
                            title: 'Project Shortcut',
                            description: '@string/small_shortcut_widget_description',
                            resource: '@xml/small_shortcut_widget_info',
                        },
                        {
                            receiverName: 'MediumFirewallWidgetReceiver',
                            configurationActivity: 'MediumFirewallConfigurationActivity',
                            title: 'Firewall',
                            description: '@string/medium_firewall_widget_description',
                            resource: '@xml/medium_firewall_widget_info',
                        },
                        {
                            receiverName: 'MediumMetricsWidgetReceiver',
                            configurationActivity: 'MediumMetricsConfigurationActivity',
                            title: 'Functions',
                            description: '@string/medium_functions_widget_description',
                            resource: '@xml/medium_metrics_widget_info',
                        },
                    ],
                },
            ],
            'expo-font',
            'expo-web-browser',
            [
                'expo-alternate-app-icons',
                [
                    {
                        name: 'NodesDark',
                        ios: './assets/icon-nodes-dark.png',
                        android: {
                            foregroundImage: './assets/icon-nodes-dark.png',
                            backgroundColor: '#12181F',
                        },
                    },
                    {
                        name: 'SymbolDark',
                        ios: './assets/icon-symbol-dark.png',
                        android: {
                            foregroundImage: './assets/icon-symbol-dark.png',
                            backgroundColor: '#12181F',
                        },
                    },
                    {
                        name: 'SymbolLight',
                        ios: './assets/icon-symbol-light.png',
                        android: {
                            foregroundImage: './assets/icon-symbol-light.png',
                            backgroundColor: '#12181F',
                        },
                    },
                    {
                        name: 'SymbolNodesDark',
                        ios: './assets/icon-symbol-nodes-dark.png',
                        android: {
                            foregroundImage: './assets/icon-symbol-nodes-dark.png',
                            backgroundColor: '#12181F',
                        },
                    },
                    {
                        name: 'SymbolNodesLight',
                        ios: './assets/icon-symbol-nodes-light.png',
                        android: {
                            foregroundImage: './assets/icon-symbol-nodes-light.png',
                            backgroundColor: '#12181F',
                        },
                    },
                ],
            ],
        ],

        experiments: {
            typedRoutes: true,
        },
        extra: {
            router: {
                origin: false,
            },
            eas: {
                projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
            },
        },
    }
}
