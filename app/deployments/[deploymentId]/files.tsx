import { fetchSiteDeploymentFiles } from '@/api/queries'
import { type DeploymentAsset, FileTreeAsset } from '@/components/DeploymentFileTree'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useGlobalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Sort the tree recursively
function sortTree(items: DeploymentAsset[]): DeploymentAsset[] {
    return items
        .sort((a, b) => {
            // Directories first, then alphabetically
            if (a.children && !b.children) return -1
            if (!a.children && b.children) return 1
            return a.path.localeCompare(b.path)
        })
        .map((item) => {
            if (item.children) {
                return {
                    ...item,
                    children: sortTree(item.children),
                }
            }
            return item
        })
}

function buildFileTree(files: DeploymentAsset[]) {
    const rootDirectory: DeploymentAsset[] = []

    // Sort files to ensure consistent order
    files.sort((a, b) => a.path.localeCompare(b.path))

    for (const file of files) {
        // Remove leading slash if present
        const path = file.path.startsWith('/') ? file.path.slice(1) : file.path
        const pathParts = path.split('/')

        // If file is in root directory, add it directly
        if (pathParts.length === 1) {
            rootDirectory.push(file)
            continue
        }

        // Get directory path parts (everything except the file name)
        const directoryParts = pathParts.slice(0, -1)
        let parentDirectory = rootDirectory

        // Create or traverse directory structure
        for (let i = 0; i < directoryParts.length; i++) {
            const dirPath = directoryParts.slice(0, i + 1).join('/')

            // Find or create directory at current level
            let directory = parentDirectory.find((item) => item.path === dirPath)
            if (!directory) {
                directory = {
                    id: dirPath,
                    path: dirPath,
                    sha: '',
                    mime_type: 'directory',
                    size: 0,
                    site_id: file.site_id,
                    deploy_id: file.deploy_id,
                    children: [],
                    isExpanded: false,
                }
                parentDirectory.push(directory)
            }

            // Move to next directory level
            parentDirectory = directory.children!
        }

        // Add file to its parent directory
        parentDirectory.push(file)
    }

    return sortTree(rootDirectory)
}

export default function DeploymentFilesScreen() {
    const { deploymentId } = useGlobalSearchParams<{ deploymentId: string }>()
    const [fileTree, setFileTree] = useState<DeploymentAsset[]>([])

    const deploymentFilesQuery = useQuery({
        queryKey: ['deploys', deploymentId, 'files'],
        queryFn: () => fetchSiteDeploymentFiles({ id: deploymentId }),
    })

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: deploymentFilesQuery.isLoading,
            hasData: fileTree.length > 0,
            isError: deploymentFilesQuery.isError,
            emptyLabel: 'No files found',
            errorLabel: 'Failed to fetch files',
        })
    }, [deploymentFilesQuery.isLoading, deploymentFilesQuery.isError, fileTree.length])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useEffect(() => {
        if (deploymentFilesQuery.data) {
            console.log(deploymentFilesQuery.data)
            setFileTree(buildFileTree(deploymentFilesQuery.data))
        }
    }, [deploymentFilesQuery.data])

    const handleFolderPress = useCallback((path: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

        setFileTree((currentTree) => {
            function toggleFolder(items: DeploymentAsset[]): DeploymentAsset[] {
                return items.map((item) => {
                    if (item.path === path && item.children) {
                        return {
                            ...item,
                            isExpanded: !item.isExpanded,
                        }
                    }
                    if (item.children) {
                        return {
                            ...item,
                            children: toggleFolder(item.children),
                        }
                    }
                    return item
                })
            }
            return toggleFolder(currentTree)
        })
    }, [])

    return (
        <FlashList
            data={fileTree}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl onRefresh={deploymentFilesQuery.refetch} />}
            overrideProps={overrideProps}
            contentContainerStyle={{
                paddingHorizontal: 16,
            }}
            ListEmptyComponent={Placeholder}
            renderItem={({ item }) => (
                <FileTreeAsset key={item.path} asset={item} onFolderPress={handleFolderPress} />
            )}
        />
    )
}
