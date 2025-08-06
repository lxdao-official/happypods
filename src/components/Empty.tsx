const Empty = ({ theme = 'dark' }: { theme?: 'light' | 'dark' }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <img src="/empty2.svg" className="h-60 grayscale opacity-40" />
            {/* <i className="text-6xl ri-folder-open-line text-default-400"></i> */}
            <span className="text-2xl text-default-400">No data ~</span>
        </div>
    )
}

export default Empty;