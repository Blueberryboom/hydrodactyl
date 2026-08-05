import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDatabaseHostLocations } from '@/api/admin/databases';
import { createAdminNode } from '@/api/admin/nodes';
import { getAdminS3Buckets } from '@/api/admin/s3';
import type { AdminNodeLocationRef, NodeFormPayload } from '@/api/admin/types';
import { AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import NodeForm from '@/components/admin/nodes/NodeForm';

const NodeCreateContainer = () => {
    const navigate = useNavigate();
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

    const handleSubmit = async (payload: NodeFormPayload) => {
        const node = await createAdminNode(payload);
        navigate(`/admin/nodes/view/${node.id}/allocation`);
    };

    return (
        <AdminPage title='Create Node' description='Create a new local or remote node for servers to be installed to.'>
            {locationError || bucketError ? (
                <AdminError error={locationError ?? bucketError} />
            ) : !locationData || !bucketData ? (
                <AdminLoading />
            ) : (
                <NodeForm
                    locations={locations}
                    s3Buckets={bucketData.items}
                    submitLabel='Create Node'
                    cancelTo='/admin/nodes'
                    onSubmit={handleSubmit}
                />
            )}
        </AdminPage>
    );
};

export default NodeCreateContainer;
