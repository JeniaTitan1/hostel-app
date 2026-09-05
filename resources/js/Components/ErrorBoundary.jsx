import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-100">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6 sm:p-8 text-center space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Сталася неочікувана помилка
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Інтерфейс зіткнувся з помилкою відображення. Натисніть кнопку нижче, щоб оновити сторінку без втрати сесії.
                        </p>
                        {this.state.error && (
                            <div className="text-[11px] p-2.5 rounded-xl bg-slate-100 dark:bg-gray-700/60 font-mono text-left text-rose-600 dark:text-rose-400 overflow-x-auto max-h-24">
                                {this.state.error.message || String(this.state.error)}
                            </div>
                        )}
                        <div className="pt-2 flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
                            >
                                Перезавантажити сторінку
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
