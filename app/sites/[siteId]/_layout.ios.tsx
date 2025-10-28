import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs'

export default function TabsLayout() {
    return (
        <NativeTabs disableTransparentOnScrollEdge={true} tintColor={COLORS.teal500}>
            <NativeTabs.Trigger name="home">
                <Label>Deploys</Label>
                <Icon src={<VectorIcon family={Ionicons} name="rocket" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="logs">
                <Label>Logs</Label>
                <Icon src={<VectorIcon family={Ionicons} name="code-slash" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="forms">
                <Label>Forms</Label>
                <Icon src={<VectorIcon family={Ionicons} name="document-text" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="domains">
                <Label>Domains</Label>
                <Icon src={<VectorIcon family={Ionicons} name="link" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="env">
                <Label>Env</Label>
                <Icon src={<VectorIcon family={Ionicons} name="key" />} />
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
