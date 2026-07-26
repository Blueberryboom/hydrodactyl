import { useNavigate } from 'react-router-dom';
import { createAdminLocation } from '@/api/admin/locations';
import type { LocationFormPayload } from '@/api/admin/types';
import { AdminPage } from '@/components/admin/common';
import LocationForm from '@/components/admin/locations/LocationForm';

const LocationCreateContainer = () => {
    const navigate = useNavigate();

    const handleSubmit = async (payload: LocationFormPayload) => {
        const location = await createAdminLocation(payload);
        navigate(`/admin/locations/view/${location.id}`);
    };

    return (
        <AdminPage title='Create Location' description='Create a new location for nodes and servers.'>
            <LocationForm submitLabel='Create Location' onSubmit={handleSubmit} />
        </AdminPage>
    );
};

export default LocationCreateContainer;
