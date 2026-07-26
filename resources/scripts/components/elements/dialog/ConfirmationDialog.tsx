import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

import { Dialog, type RenderDialogProps } from './';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    loading?: boolean;
    disabled?: boolean;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const ConfirmationDialog = ({
    confirm = 'Okay',
    children,
    onConfirmed,
    loading,
    disabled,
    ...props
}: ConfirmationProps) => {
    return (
        <Dialog {...props} description={typeof children === 'string' ? children : undefined}>
            {typeof children !== 'string' && children}
            <Dialog.Footer>
                <Button variant='secondary' onClick={props.onClose}>
                    Cancel
                </Button>
                <Button variant='attention' onClick={onConfirmed} disabled={loading || disabled}>
                    <div className='flex items-center gap-2'>
                        {loading && <Spinner size='small' />}
                        <span>{confirm}</span>
                    </div>
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

export default ConfirmationDialog;
