import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminLocations } from '@/api/admin/locations';
import {
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminPagination,
    AdminSearchForm,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';

const LocationListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [short, setShort] = useState(searchParams.get('short') ?? '');
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:locations', page, short], () => getAdminLocations({ page, short }));

    return (
        <AdminPage
            title='Locations'
            description='All configured locations available to nodes and servers.'
            actions={
                <AdminSearchForm
                    value={short}
                    placeholder='Search by identifier'
                    createTo='/admin/locations/new'
                    createLabel='Create New'
                    onSubmit={(value) => {
                        setShort(value);
                        setSearchParams(value ? { short: value } : {});
                    }}
                />
            }
        >
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No locations found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => {
                        setSearchParams({ ...(short ? { short } : {}), page: String(selectedPage) });
                    }}
                >
                    {(locations) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Identifier</th>
                                    <th className='px-4 py-3'>Description</th>
                                    <th className='px-4 py-3 text-right'>Nodes Online</th>
                                    <th className='px-4 py-3'>Created</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {locations.map((location) => (
                                    <tr key={location.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{location.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/locations/view/${location.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
                                                {location.short}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3'>{location.long}</td>
                                        <td
                                            className={`px-4 py-3 text-right font-medium ${
                                                location.onlineNodeCount === location.nodeCount
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                            }`}
                                        >
                                            {location.onlineNodeCount}/{location.nodeCount}
                                        </td>
                                        <td className='px-4 py-3 text-white/55'>{location.createdAt}</td>
                                    </tr>
                                ))}
                            </AdminTableBody>
                        </AdminTable>
                    )}
                </AdminPagination>
            )}
        </AdminPage>
    );
};

export default LocationListContainer;
