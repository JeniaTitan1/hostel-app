export default function ApplicationLogo({ className = 'w-12 h-12', ...props }) {
    return (
        <div
            className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black shadow-md shadow-emerald-600/20 select-none ${className}`}
            {...props}
        >
            <span className="text-xl tracking-tight font-extrabold font-serif">М</span>
        </div>
    );
}
