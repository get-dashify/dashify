import { createEnvVar } from '@/api/mutations'
import { fetchSite } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CONTEXTS: {
    key: 'all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production'
    name: string
}[] = [
    { key: 'production', name: 'Production' },
    { key: 'deploy-preview', name: 'Deploy Preview' },
    { key: 'branch-deploy', name: 'Branch Deploy' },
    { key: 'dev', name: 'Development' },
    { key: 'all', name: 'All' },
]

export default function AddEnvVariableScreen() {
    const { siteId } = useLocalSearchParams<{ siteId: string }>()

    const siteQuery = useQuery({
        queryKey: ['sites', siteId],
        queryFn: () => fetchSite({ id: siteId }),
    })

    const [key, setKey] = useState('')
    const [value, setValue] = useState('')
    const [selectedContexts, setSelectedContexts] = useState<
        ('all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production')[]
    >(['production'])
    const [isSecret, setIsSecret] = useState(false)

    const createEnvVarMutation = useMutation({
        mutationFn: createEnvVar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'env'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const handleCreate = useCallback(async () => {
        if (!siteQuery.data?.account_id) {
            return
        }

        if (!key.trim() || !value.trim() || selectedContexts.length === 0) {
            Alert.alert('Error', 'Please fill in all required fields')
            return
        }

        await createEnvVarMutation.mutateAsync({
            siteId,
            accountId: siteQuery.data.account_id!,
            key: key.trim(),
            value: value.trim(),
            contexts: selectedContexts,
            isSecret,
        })
    }, [
        key,
        value,
        selectedContexts,
        isSecret,
        createEnvVarMutation,
        siteId,
        siteQuery.data?.account_id,
    ])

    if (!siteQuery.data?.account_id) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.teal} />
            </View>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgApp }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 32,
                        gap: 20,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Name field */}
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                            Name
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: COLORS.bgDarker,
                                borderRadius: 8,
                                padding: 12,
                                color: COLORS.text,
                                fontSize: 14,
                            }}
                            value={key}
                            onChangeText={setKey}
                            placeholder="e.g. API_KEY"
                            placeholderTextColor={COLORS.textMuted}
                            autoCapitalize="characters"
                            autoComplete="off"
                            autoCorrect={false}
                            keyboardAppearance="dark"
                        />
                    </View>

                    {/* Value field */}
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                            Value
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: COLORS.bgDarker,
                                borderRadius: 8,
                                padding: 12,
                                color: COLORS.text,
                                fontSize: 14,
                                minHeight: 80,
                                textAlignVertical: 'top',
                            }}
                            value={value}
                            onChangeText={setValue}
                            placeholder="Enter value"
                            placeholderTextColor={COLORS.textMuted}
                            multiline={true}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect={false}
                            keyboardAppearance="dark"
                        />
                    </View>

                    {/* Contexts */}
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                            Contexts
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {CONTEXTS.map((context) => {
                                const isSelected = selectedContexts.includes(context.key)
                                return (
                                    <TouchableOpacity
                                        key={context.key}
                                        style={{
                                            backgroundColor: isSelected
                                                ? COLORS.teal
                                                : COLORS.bgDarker,
                                            padding: 10,
                                            paddingHorizontal: 16,
                                            borderRadius: 8,
                                        }}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            if (isSelected) {
                                                setSelectedContexts(
                                                    selectedContexts.filter(
                                                        (c) => c !== context.key
                                                    )
                                                )
                                            } else {
                                                setSelectedContexts([
                                                    ...selectedContexts,
                                                    context.key,
                                                ])
                                            }
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                color: isSelected ? COLORS.bgApp : COLORS.text,
                                                fontWeight: isSelected ? '600' : '400',
                                            }}
                                        >
                                            {context.name}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>

                    {/* Secret switch */}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: COLORS.bgDarker,
                            padding: 16,
                            borderRadius: 8,
                        }}
                    >
                        <View style={{ flexDirection: 'column', gap: 4, flex: 1 }}>
                            <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                                Secret
                            </Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                                Secret values are only readable by Netlify's systems
                            </Text>
                        </View>
                        <Switch
                            value={isSecret}
                            onValueChange={setIsSecret}
                            trackColor={{
                                true: COLORS.teal,
                                false: undefined,
                            }}
                            thumbColor={Platform.OS === 'android' ? COLORS.text : undefined}
                        />
                    </View>

                    {/* Create button */}
                    <TouchableOpacity
                        style={{
                            padding: 16,
                            borderRadius: 8,
                            backgroundColor: COLORS.teal,
                            marginTop: 8,
                        }}
                        disabled={createEnvVarMutation.isPending}
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                            handleCreate()
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.bgApp,
                                textAlign: 'center',
                                fontSize: 16,
                                fontWeight: '600',
                            }}
                        >
                            {createEnvVarMutation.isPending ? 'Creating...' : 'Create'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
