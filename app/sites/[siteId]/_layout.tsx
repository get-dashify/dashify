import { fetchSite } from '@/api/queries'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { Tabs, useLocalSearchParams } from 'expo-router'
import { Platform } from 'react-native'

export default function TabsLayout() {
    const { siteId } = useLocalSearchParams<{ siteId: string }>()

    // used for checking if we should show Forms
    // if the user has forms enabled for this website
    const siteQuery = useQuery({
        queryKey: ['sites', siteId],
        queryFn: () => fetchSite({ id: siteId }),
    })

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.teal500,
                tabBarStyle: {
                    borderTopColor: COLORS.hr,
                    backgroundColor: COLORS.bgDarker,
                    borderTopWidth: Platform.OS === 'ios' ? 1 : 0.2,
                    paddingTop: 8,
                    paddingBottom: 24,
                    height: 84,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Deploys',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'rocket' : 'rocket-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="logs"
                options={{
                    title: 'Logs',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'code-slash' : 'code-slash-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            {/* {siteQuery.data?.processing_settings?.ignore_html_forms === false ? ( */}
            <Tabs.Screen
                name="forms"
                options={{
                    title: 'Forms',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'document-text' : 'document-text-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            {/* ) : undefined} */}

            <Tabs.Screen
                name="domains"
                options={{
                    title: 'Domains',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'link' : 'link-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="env"
                options={{
                    title: 'Env',
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons
                            name={focused ? 'key' : 'key-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}
