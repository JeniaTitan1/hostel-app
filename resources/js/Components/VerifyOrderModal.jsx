import React, { useState } from 'react';
import Modal from '@/Components/Modal';

export default function VerifyOrderModal({ show, onClose }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleVerify = async (e) => {
        e?.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/verify-order?code=${encodeURIComponent(code.trim())}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setResult(data.booking);
            } else {
                setError(data.message || 'Ордер не знайдено або він є недійсним.');
            }
        } catch (err) {
            setError('Помилка з\'єднання із сервером. Спробуйте пізніше.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCode('');
        setResult(null);
        setError(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black shadow-xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">
                                Перевірка справжності ордера
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Введіть унікальний номер ордера на заселення МНАУ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleVerify} className="mt-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Унікальний код ордера (наприклад, ORD-2026-A1B2C3):
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="ORD-2026-XXXXXX"
                                    className="w-full text-sm font-mono tracking-wider font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                                    required
                                />
                                {code && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                    >
                                        Очистити
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !code.trim()}
                                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                {loading ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span>Перевірити</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Results Section */}
                {result && (
                    <div className="mt-5 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs w-fit">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                ОРДЕР ДІЙСНИЙ
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                {result.order_number}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Студент:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{result.user.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Гуртожиток:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{result.room.building.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Поверх / Кімната:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    Поверх {result.room.floor}, Кімната №{result.room.room_number}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Курс / Група:</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                    {result.user.course ? `${result.user.course} курс` : '-'} • {result.user.group || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Напрям:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{result.user.specialty || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">Контактний тел:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{result.user.phone || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-1">
                            <span>Дата реєстрації в системі: {result.created_at}</span>
                            <span className="font-bold">МНАУ Спеціальний реєстр</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-800 dark:text-red-300 text-xs font-semibold animate-fade-in">
                        <div className="w-5 h-5 rounded-full bg-red-200 dark:bg-red-900/60 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
