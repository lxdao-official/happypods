const Empty = ({ imgClassName = '', textClassName = '', theme = 'light' }: { imgClassName?: string, textClassName?: string, theme?: 'light' | 'dark' }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8 fadeIn">
            <img src={theme === 'light' ? "/empty2.svg" : "/empty2-light.svg"} className={`h-60 grayscale opacity-40 ${imgClassName}`} /> 
            {/* <i className="text-6xl ri-folder-open-line text-default-400"></i> */}
            <span className={`text-2xl text-default-400 ${textClassName}`}>No data ~</span>
        </div>
    )
}

export default Empty;