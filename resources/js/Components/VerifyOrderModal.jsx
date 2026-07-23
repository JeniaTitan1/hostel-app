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
                            🔍
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
                        <div className="flex gap-2">
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
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                            >
                                {loading ? (
                                    <span className="inline-block animate-spin">⏳</span>
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
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                                ✓ ОРДЕР ДІЙСНИЙ
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                {result.order_number}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
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
                        <span className="text-lg">❌</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
