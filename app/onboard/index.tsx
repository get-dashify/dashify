import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { type OnboardingFeature, OnboardingView } from 'expo-onboarding'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

const FEATURES: OnboardingFeature[] = [
    {
        title: 'Manage Netlify',
        description:
            'See logs, browse deployments, and check on your websites using home screen widgets.',
        systemImage: 'server.rack',
        icon: () => <Ionicons name="server" size={42} color={COLORS.teal500} />,
    },
    {
        title: 'Open Source',
        description:
            'You are using Open Source Software (OSS) crafted by serverless-loving people. Give it a star!',
        systemImage: 'star.fill',
        icon: () => <Ionicons name="star" size={42} color={COLORS.teal500} />,
        links: [
            {
                sectionText: 'Give it a star!',
                sectionUrl: 'https://github.com/get-dashify/dashify',
            },
        ],
    },
    {
        title: 'Local Only',
        description:
            'Your data never leaves the app, this includes your API token which is locally stored.',
        systemImage: 'shield.fill',
        icon: () => <Ionicons name="shield" size={42} color={COLORS.teal500} />,
    },
]

export default function OnboardScreen() {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: 'black',
                paddingTop: 100,
            }}
        >
            <OnboardingView
                features={FEATURES}
                icon={require('@/assets/icon.png')}
                appName="Dashify"
                tintColor={COLORS.teal500}
                titleStyle={{}}
                featureTitleStyle={{
                    color: COLORS.text,
                }}
                featureDescriptionStyle={{
                    color: COLORS.textMuted,
                }}
                ButtonComponent={() => (
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            maxWidth: '80%',
                            backgroundColor: COLORS.teal500,
                            padding: 10,
                            borderRadius: 12.5,
                        }}
                        onPress={() => {
                            usePersistedStore.setState({ hasSeenOnboarding: true })
                            router.dismissTo('/')
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.text,
                                textAlign: 'center',
                                fontSize: 20,
                                fontWeight: 600,
                                paddingTop: 4,
                                paddingBottom: 6,
                            }}
                        >
                            Let's go
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}
