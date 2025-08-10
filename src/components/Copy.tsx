'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const Copy = ({text, children}: {text: string, children?: React.ReactNode}) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (text: string, result: boolean) => {
        if (result) {
            // 复制成功
            setIsCopied(true);
            toast.success('Copied');
            setTimeout(() => setIsCopied(false), 2000);
        } else {
            // 复制失败
            toast.error('Copy failed');
        }
    }

    return (
        <CopyToClipboard text={text} onCopy={handleCopy}>
           <i className={`ri-${isCopied ? 'check-line' : 'file-copy-line'} text-base hover:opacity-70 cursor-pointer`}></i>
        </CopyToClipboard>
    )
}

export default Copy;