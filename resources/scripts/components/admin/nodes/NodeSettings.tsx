import useSWR from 'swr';
import { getAdminDatabaseHostLocations } from '@/api/admin/databases';
import { updateAdminNode } from '@/api/admin/nodes';
import { getAdminS3Buckets } from '@/api/admin/s3';
import type { AdminNode, AdminNodeLocationRef, NodeFormPayload } from '@/api/admin/types';
import { AdminError, AdminLoading } from '@/components/admin/common';
import NodeForm from '@/components/admin/nodes/NodeForm';

interface NodeSettingsProps {
    node: AdminNode;
    onUpdated: (data: AdminNode, shouldRevalidate?: boolean) => Promise<unknown>;
}

const NodeSettings = ({ node, onUpdated }: NodeSettingsProps) => {
    const { data: locationData, error: locationError } = useSWR(
        'admin:node-form-locations',
        getAdminDatabaseHostLocations,
    );
    const { data: bucketData, error: bucketError } = useSWR('admin:node-form-buckets', () =>
        getAdminS3Buckets({ page: 1 }),
    );

    const locations: AdminNodeLocationRef[] = (locationData ?? []).map((location) => ({
        id: location.id,
        short: location.short,
        long: location.long,
    }));

    const handleSubmit = async (payload: NodeFormPayload, resetSecret: boolean) => {
        const updated = await updateAdminNode(node.id, payload, resetSecret);
        await onUpdated(
            {
                ...updated,
                location: node.location,
                servers: node.servers,
                allocations: node.allocations,
            },
            false,
        );
    };

    return locationError || bucketError ? (
        <AdminError error={locationError ?? bucketError} />
    ) : !locationData || !bucketData ? (
        <AdminLoading />
    ) : (
        <NodeForm
            node={node}
            locations={locations}
            s3Buckets={bucketData.items}
            submitLabel='Save Changes'
            cancelTo={`/admin/nodes/view/${node.id}`}
            onSubmit={handleSubmit}
        />
    );
};

export default NodeSettings;
