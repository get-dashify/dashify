import { fetchUserAccounts, fetchUserInfo } from '@/api/queries'
import { checkLoginCredentials } from '@/lib/login'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { router, useNavigation } from 'expo-router'
import { usePlacement } from 'expo-superwall'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    Button,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { KeyboardAwareScrollView, useAnimatedKeyboard } from 'react-native-keyboard-controller'
import Animated, { interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LoginScreen() {
    const navigation = useNavigation()
    const { registerPlacement } = usePlacement()

    const connections = usePersistedStore((state) => state.connections)
    const addConnection = usePersistedStore((state) => state.addConnection)
    const switchConnection = usePersistedStore((state) => state.switchConnection)

    const apiTokenRef = useRef<string>('')

    const [isModal, setIsModal] = useState(false)

    const showCloseButton = useMemo(() => {
        return Platform.OS === 'android' && isModal
    }, [isModal])

    const keyboard = useAnimatedKeyboard()

    const helpBoxAnimatedStyles = useAnimatedStyle(() => {
        const isKeyboardVisible = interpolate(keyboard.height.value, [0, 1], [0, 1], 'clamp')

        return {
            opacity: withTiming(isKeyboardVisible ? 0 : 1),
            bottom: withTiming(isKeyboardVisible ? -300 : 0),
        }
    })

    const loginMutation = useMutation({
        mutationFn: async () => {
            const token = apiTokenRef.current.trim()
            if (!token) {
                throw new Error('Please enter an API token')
            }

            const user = await checkLoginCredentials(token)
            if (!user || !user.id || !user.email) {
                throw new Error('Invalid token')
            }

            if (connections.find((c) => c.id === user.id)) {
                throw new Error('You are already connected to this account')
            }

            addConnection({
                id: user.id,
                email: user.email,
                apiToken: token,
                currentAccountId: null,
                currentAccountSlug: null,
            })

            switchConnection({ connectionId: user.id })

            if (connections.length === 1) {
                registerPlacement({
                    placement: 'SuccessfulLogin',
                }).catch()
            }

            await queryClient.prefetchQuery({
                queryKey: ['user', user.id, 'info'],
                queryFn: fetchUserInfo,
            })

            await queryClient.prefetchQuery({
                queryKey: ['user', user.id, 'accounts'],
                queryFn: async () => {
                    const accounts = await fetchUserAccounts({ connectionId: user.id })
                    return {
                        connectionId: user.id,
                        accounts,
                    }
                },
            })
        },
        onSuccess: () => {
            router.replace('/home/')
        },
        onError: (error) => {
            console.error('[handleLogin] error', error)
            Alert.alert('Error', error.message || 'Could not connect to Netlify')
        },
    })

    const openApiDocs = useCallback(() => {
        try {
            Linking.openURL('https://docs.netlify.com/api/get-started/#authentication')
        } catch {}
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setIsModal(connections.length > 0)
    }, [])

    useLayoutEffect(() => {
        navigation.setOptions({
            gestureEnabled: isModal,
            // animation: isModal ? undefined : 'none',
        })
    }, [navigation, isModal])

    return (
        <>
            <SafeAreaView style={{ flex: 1 }} edges={Platform.OS === 'android' ? ['top'] : []}>
                <KeyboardAwareScrollView
                    bottomOffset={20}
                    extraKeyboardSpace={70}
                    keyboardShouldPersistTaps="handled"
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.bgApp,
                    }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: isModal ? 60 : 120,
                        paddingBottom: 280,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {showCloseButton && (
                        <TouchableOpacity
                            style={{
                                position: 'absolute',
                                top: -50, // to negate the paddingTop
                                right: 30,
                                backgroundColor: '#ffffff28',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 16,
                                height: 32,
                                width: 32,
                            }}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    )}

                    <View
                        style={{
                            flexGrow: 1,
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignSelf: 'center',
                            gap: 64,
                            maxWidth: 320,
                            width: '100%',
                        }}
                    >
                        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <Image
                                source={require('../../assets/icon.png')}
                                style={{
                                    width: 250,
                                    height: 250,
                                    // extra
                                    marginBottom: 24,
                                    borderRadius: 12,
                                }}
                                resizeMode="contain"
                            />
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    color: COLORS.textLoud,
                                }}
                            >
                                {isModal ? 'Add Account' : 'Welcome to Dashify'}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '400',
                                    textAlign: 'center',
                                    color: COLORS.textMuted,
                                }}
                            >
                                {isModal
                                    ? 'Add an API token for a new account!'
                                    : 'Add your API token to get started!'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'column', gap: 10 }}>
                            <Text style={{ color: COLORS.text }}>API Token</Text>
                            <TextInput
                                style={{
                                    height: 48,
                                    paddingHorizontal: 16,
                                    borderRadius: 8,
                                    backgroundColor: COLORS.bgDark,
                                    color: COLORS.text,
                                    fontSize: 16,
                                }}
                                placeholder="Add an API token"
                                placeholderTextColor={COLORS.placeholder}
                                secureTextEntry={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="off"
                                keyboardAppearance="dark"
                                onChangeText={(text) => {
                                    apiTokenRef.current = text
                                }}
                                returnKeyLabel="Connect"
                                returnKeyType="go"
                                onSubmitEditing={() => loginMutation.mutate()}
                            />
                            <View style={{ marginTop: 20 }}>
                                <Button
                                    title={loginMutation.isPending ? 'Connecting...' : 'Connect'}
                                    onPress={() => loginMutation.mutate()}
                                    disabled={loginMutation.isPending}
                                    color={
                                        Platform.OS === 'android' && loginMutation.isPending
                                            ? COLORS.text
                                            : COLORS.teal500
                                    }
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
            {!isModal && (
                <Animated.View style={[helpBoxAnimatedStyles]}>
                    <Pressable style={styles.helpBox} onPress={openApiDocs}>
                        <Text style={styles.helpTitle}>Need help finding your API key?</Text>
                        <Text style={styles.helpText}>
                            Tap to learn how to generate a Netlify API token.
                        </Text>
                    </Pressable>
                </Animated.View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    helpBox: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,

        backgroundColor: COLORS.bgDark,
        marginHorizontal: 24,
        padding: 24,

        // marginBottom: Math.max(rt.insets.bottom, 25),
        marginBottom: 25,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.hr,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    helpText: { fontSize: 12, fontWeight: '400', color: COLORS.textMuted },
})
