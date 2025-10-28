import { deleteEnvVar, updateEnvVar } from '@/api/mutations'
import { fetchSite, fetchSiteEnvVar } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
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

export default function EditEnvVariableScreen() {
    const navigation = useNavigation()
    const { siteId, variableId } = useLocalSearchParams<{ siteId: string; variableId: string }>()

    const key = decodeURIComponent(variableId)

    const siteQuery = useQuery({
        queryKey: ['sites', siteId],
        queryFn: () => fetchSite({ id: siteId }),
    })

    const envVarQuery = useQuery({
        queryKey: ['sites', siteId, 'env', key],
        queryFn: () =>
            fetchSiteEnvVar({
                siteId,
                accountId: siteQuery.data?.account_id!,
                key,
            }),
        enabled: !!siteQuery.data?.account_id,
    })

    const [values, setValues] = useState<
        {
            id?: string
            value: string
            context: 'all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production' | 'branch'
            context_parameter?: string
        }[]
    >([])
    const [isSecret, setIsSecret] = useState(false)

    const updateEnvVarMutation = useMutation({
        mutationFn: updateEnvVar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'env'] })
            queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'env', key] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const deleteEnvVarMutation = useMutation({
        mutationFn: deleteEnvVar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'env'] })
            router.back()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const selectedContexts = useMemo(() => values.map((v) => v.context), [values])

    const handleUpdate = useCallback(async () => {
        if (!siteQuery.data?.account_id) {
            return
        }

        if (values.length === 0 || values.some((v) => !v.value.trim())) {
            Alert.alert('Error', 'Please provide values for all contexts')
            return
        }

        const valuesToSend = values.map((v) => {
            const val: any = {
                value: v.value.trim(),
                context: v.context,
            }
            if (v.id) {
                val.id = v.id
            }
            if (v.context_parameter) {
                val.context_parameter = v.context_parameter
            }
            return val
        })

        await updateEnvVarMutation.mutateAsync({
            siteId,
            accountId: siteQuery.data.account_id,
            key,
            values: valuesToSend,
            isSecret,
        })
    }, [values, siteQuery.data?.account_id, key, isSecret, updateEnvVarMutation, siteId])

    const handleDelete = useCallback(async () => {
        if (!siteQuery.data?.account_id) {
            return
        }

        Alert.alert('Delete Variable', `Are you sure you want to delete "${key}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    deleteEnvVarMutation.mutate({
                        siteId,
                        accountId: siteQuery.data.account_id!,
                        key,
                    })
                },
            },
        ])
    }, [key, siteQuery.data?.account_id, deleteEnvVarMutation, siteId])

    const addContext = useCallback(
        (context: 'all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production') => {
            setValues((prev) => [...prev, { value: '', context, context_parameter: undefined }])
        },
        []
    )

    const removeContext = useCallback((index: number) => {
        setValues((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const updateValue = useCallback((index: number, newValue: string) => {
        setValues((prev) => {
            const newValues = [...prev]
            newValues[index] = { ...newValues[index], value: newValue }
            return newValues
        })
    }, [])

    useEffect(() => {
        if (envVarQuery.data) {
            setValues(
                envVarQuery.data.values?.map((v) => ({
                    id: v.id,
                    value: v.value || '',
                    context:
                        v.context ||
                        ('production' as
                            | 'all'
                            | 'dev'
                            | 'branch-deploy'
                            | 'deploy-preview'
                            | 'production'
                            | 'branch'),
                    context_parameter: v.context_parameter,
                })) || []
            )
            setIsSecret(envVarQuery.data.is_secret || false)
        }
    }, [envVarQuery.data])

    useLayoutEffect(() => {
        if (!key) return

        navigation.setOptions({
            title: `Edit ${key}`,
        })
    }, [key, navigation])

    if (envVarQuery.isLoading || !siteQuery.data?.account_id) {
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
                    {/* Name field (read-only) */}
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                            Name
                        </Text>
                        <View
                            style={{
                                backgroundColor: COLORS.bgDarker,
                                borderRadius: 8,
                                padding: 12,
                                opacity: 0.6,
                            }}
                        >
                            <Text style={{ color: COLORS.text, fontSize: 14 }}>{key}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                            Key name cannot be changed. Delete and recreate to rename.
                        </Text>
                    </View>

                    {/* Values by context */}
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600' }}>
                            Values
                        </Text>

                        {values.map((v, index) => (
                            <View key={index} style={{ flexDirection: 'column', gap: 8 }}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                                        {CONTEXTS.find((c) => c.key === v.context)?.name ||
                                            v.context}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            removeContext(index)
                                        }}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={COLORS.red600}
                                        />
                                    </TouchableOpacity>
                                </View>
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
                                    value={v.value}
                                    onChangeText={(text) => updateValue(index, text)}
                                    placeholder="Enter value"
                                    placeholderTextColor={COLORS.textMuted}
                                    multiline={true}
                                    autoCapitalize="none"
                                    autoComplete="off"
                                    keyboardAppearance="dark"
                                    autoCorrect={false}
                                />
                            </View>
                        ))}

                        {/* Add context button */}
                        <View
                            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}
                        >
                            {CONTEXTS.filter((c) => !selectedContexts.includes(c.key)).map(
                                (context) => (
                                    <TouchableOpacity
                                        key={context.key}
                                        style={{
                                            backgroundColor: COLORS.bgDarker,
                                            padding: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 8,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            addContext(context.key)
                                        }}
                                    >
                                        <Ionicons name="add" size={16} color={COLORS.teal} />
                                        <Text style={{ fontSize: 12, color: COLORS.text }}>
                                            {context.name}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
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

                    <View
                        style={{
                            flexDirection: 'column',
                            gap: 16,
                            marginTop: 8,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                padding: 16,
                                borderRadius: 8,
                                backgroundColor: COLORS.teal,
                            }}
                            disabled={updateEnvVarMutation.isPending}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                                handleUpdate()
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
                                {updateEnvVarMutation.isPending ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            disabled={deleteEnvVarMutation.isPending}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                                handleDelete()
                            }}
                        >
                            <Text
                                style={{
                                    color: COLORS.red500,
                                    textAlign: 'center',
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                            >
                                {deleteEnvVarMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
