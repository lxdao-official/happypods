import { Skeleton } from "@heroui/react";

const LoadingSkeleton = ({ theme = 'dark' }: { theme?: 'light' | 'dark' }) => {
    return (
        <div className="flex flex-col gap-4 py-8 fadeIn">
            <Skeleton className={`w-full h-40 rounded-xl ${theme === 'light' ? '!bg-gray-300' : ''}`}  />
        </div>
    )
}

export default LoadingSkeleton;