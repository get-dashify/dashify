import 'expo-router/entry'
import './lib/prebundle'
import * as Notifications from 'expo-notifications'
import * as SplashScreen from 'expo-splash-screen'
import { setBackgroundColorAsync } from 'expo-system-ui'
import { Platform } from 'react-native'

SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({
    duration: 500,
    fade: true,
})

if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('com.dashify.mobile', {
        name: 'Dashify Notifications',
        importance: Notifications.AndroidImportance.MAX,
        bypassDnd: true,
    })
}

try {
    setBackgroundColorAsync('#12181F') // setting it in app.json does not seem to have an effect
} catch (error) {
    console.error(error)
}
