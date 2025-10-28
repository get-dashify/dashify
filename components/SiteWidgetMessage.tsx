import WidgetKitModule from '@/modules/widgetkit'
import { COLORS } from '@/theme/colors'
import * as Sentry from '@sentry/react-native'
import { usePlacement, useUser } from 'expo-superwall'
import { Alert, Text, TouchableOpacity } from 'react-native'

export default function SiteWidgetMessage() {
    const { registerPlacement } = usePlacement()
    const { subscriptionStatus } = useUser()

    if (subscriptionStatus.status !== 'INACTIVE') {
        return null
    }

    return (
        <TouchableOpacity
            style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: COLORS.tealDarkest,
            }}
            onPress={() => {
                const featureFn = () => {
                    WidgetKitModule.setIsSubscribed(true)
                    Alert.alert(
                        'Congrats!',
                        'You can now go to your homescreen and search for "Dashify" widgets.'
                    )
                }
                if (__DEV__) {
                    featureFn()
                    return
                }

                registerPlacement({
                    placement: 'TapWidget',
                    feature: featureFn,
                }).catch((error) => {
                    Sentry.captureException(error)
                    console.error('Error registering TapWidget', error)
                    Alert.alert('Error', 'Something went wrong, please try again.')
                })
            }}
        >
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 500 }}>
                Add this site as a widget on your homescreen!
            </Text>
        </TouchableOpacity>
    )
}
