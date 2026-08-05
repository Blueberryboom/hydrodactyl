import { Link } from 'react-router-dom';
import type { AdminNode } from '@/api/admin/types';
import { AdminEmpty, AdminTable, AdminTableBody, AdminTableHead } from '@/components/admin/common';

const NodeServers = ({ node }: { node: AdminNode }) =>
    node.servers.length === 0 ? (
        <AdminEmpty>No servers are currently assigned to this node.</AdminEmpty>
    ) : (
        <AdminTable>
            <AdminTableHead>
                <tr>
                    <th className='px-4 py-3'>ID</th>
                    <th className='px-4 py-3'>Server Name</th>
                    <th className='px-4 py-3'>Owner</th>
                    <th className='px-4 py-3'>Service</th>
                </tr>
            </AdminTableHead>
            <AdminTableBody>
                {node.servers.map((server) => (
                    <tr key={server.id}>
                        <td className='px-4 py-3 font-mono text-white/55'>{server.identifier}</td>
                        <td className='px-4 py-3'>
                            <Link to={`/admin/servers/view/${server.id}`} className='text-brand hover:text-brand/80'>
                                {server.name}
                            </Link>
                        </td>
                        <td className='px-4 py-3'>
                            <Link to={`/admin/users/view/${server.ownerId}`} className='text-brand hover:text-brand/80'>
                                {server.ownerUsername}
                            </Link>
                            {server.ownerEmail && <span className='text-white/45'> ({server.ownerEmail})</span>}
                        </td>
                        <td className='px-4 py-3 text-white/65'>
                            {server.nestName} ({server.eggName ?? 'Unknown egg'})
                        </td>
                    </tr>
                ))}
            </AdminTableBody>
        </AdminTable>
    );

export default NodeServers;
