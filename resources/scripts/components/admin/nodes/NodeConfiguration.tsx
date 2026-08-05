import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { buildAdminNodeDeployCommand, getAdminNodeAutoDeployToken, getAdminNodeConfiguration } from '@/api/admin/nodes';
import type { AdminNode } from '@/api/admin/types';
import { httpErrorToHuman } from '@/api/http';
import { AdminCard, AdminError, AdminLoading } from '@/components/admin/common';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';

const stringifyConfig = (config: Record<string, unknown>): string => JSON.stringify(config, null, 4);

const NodeConfiguration = ({ node }: { node: AdminNode }) => {
    const { data, error } = useSWR(['admin:node-configuration', node.id], () => getAdminNodeConfiguration(node.id));
    const [generating, setGenerating] = useState(false);
    const [command, setCommand] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);

        try {
            const token = await getAdminNodeAutoDeployToken();
            setCommand(buildAdminNodeDeployCommand(node, token));
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!command) {
            return;
        }

        try {
            await navigator.clipboard.writeText(command);
            toast.success('Command copied to clipboard.');
        } catch {
            toast.error('Unable to copy the command to your clipboard.');
        }
    };

    return (
        <div className='grid gap-4 xl:grid-cols-[1fr_320px]'>
            <AdminCard className='flex flex-col gap-2'>
                <h2 className='mb-1 text-lg font-semibold'>Configuration File</h2>
                {error ? (
                    <AdminError error={error} />
                ) : !data ? (
                    <AdminLoading />
                ) : (
                    <pre className='overflow-x-auto rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-white/75'>
                        {stringifyConfig(data)}
                    </pre>
                )}
                <p className='text-xs text-white/45'>
                    This file should be placed in your daemon&apos;s root directory (usually{' '}
                    <code>/etc/{node.daemonType}</code>) in a file called <code>config.yml</code>.
                </p>
            </AdminCard>
            <AdminCard className='flex flex-col gap-4'>
                <h2 className='text-lg font-semibold'>Auto-Deploy</h2>
                <p className='text-sm text-white/60'>
                    Use the button below to generate a custom deployment command that can be used to configure the
                    daemon on the target server with a single command.
                </p>
                <Button type='button' variant='secondary' disabled={generating} onClick={handleGenerate}>
                    {generating ? 'Generating...' : 'Generate Token'}
                </Button>
            </AdminCard>
            <Dialog open={command !== null} onClose={() => setCommand(null)} title='Auto-Deploy Command'>
                <p className='text-sm text-white/60'>
                    To auto-configure your node, run the following command on the target server:
                </p>
                <pre className='mt-3 overflow-x-auto rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-white/75'>
                    {command}
                </pre>
                <Dialog.Footer>
                    <Button variant='secondary' onClick={() => setCommand(null)}>
                        Close
                    </Button>
                    <Button onClick={handleCopy}>Copy Command</Button>
                </Dialog.Footer>
            </Dialog>
        </div>
    );
};

export default NodeConfiguration;
