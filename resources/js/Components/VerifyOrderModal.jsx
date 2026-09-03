import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
import { Html5Qrcode } from 'html5-qrcode';

export default function VerifyOrderModal({ show, onClose }) {
    const currentYear = new Date().getFullYear();

    const [year, setYear] = useState(String(currentYear));
    const [suffix, setSuffix] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);
    const suffixRef = useRef(null);
    const yearRef = useRef(null);

    // При відкритті вікна: встановлюємо поточний рік та фокусуємо поле суфіксу
    useEffect(() => {
        if (show) {
            setYear(String(currentYear));
            setSuffix('');
            setError(null);
            setResult(null);
            setIsScanning(false);

            setTimeout(() => {
                suffixRef.current?.focus();
            }, 80);
        } else {
            stopScanning();
        }
    }, [show]);

    // Зупинка камери при закритті або розмонтуванні
    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // тихо ігноруємо
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const startScanning = async () => {
        setError(null);
        setResult(null);
        setIsScanning(true);

        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode('qr-modal-scanner');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 230, height: 230 },
                    },
                    (decodedText) => {
                        handleQrSuccess(decodedText);
                    },
                    () => {
                        // сканування триває
                    }
                );
            } catch (err) {
                console.error('QR Scanner error:', err);
                setIsScanning(false);
                setError('Не вдалося отримати доступ до камери. Перевірте дозволи у браузері.');
            }
        }, 150);
    };

    const handleQrSuccess = async (decodedText) => {
        await stopScanning();

        // Очищаємо текст від URL, якщо QR-код містив повне посилання
        let raw = decodedText.trim();
        if (raw.includes('/verify-order/')) {
            raw = raw.split('/verify-order/').pop();
        }
        raw = raw.split('?')[0].split('#')[0].toUpperCase();

        // Парсимо рік та суфікс
        const match = raw.match(/ORD-(\d{4})-([A-Z0-9]+)/i);
        if (match) {
            setYear(match[1]);
            setSuffix(match[2]);
            executeVerify(`ORD-${match[1]}-${match[2]}`);
        } else if (raw.startsWith('ORD-')) {
            const parts = raw.split('-');
            if (parts[1]) setYear(parts[1]);
            if (parts[2]) setSuffix(parts[2]);
            executeVerify(raw);
        } else {
            setSuffix(raw);
            executeVerify(`ORD-${year || currentYear}-${raw}`);
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text').trim().toUpperCase();
        if (text.includes('ORD-') || text.includes('-')) {
            e.preventDefault();
            const clean = text.replace(/.*\/verify-order\//, '');
            const match = clean.match(/ORD-(\d{4})-([A-Z0-9]+)/i);
            if (match) {
                setYear(match[1]);
                setSuffix(match[2]);
            } else {
                const parts = clean.split('-');
                if (parts.length >= 3) {
                    setYear(parts[1]);
                    setSuffix(parts[2]);
                } else if (parts.length === 2) {
                    setYear(parts[0]);
                    setSuffix(parts[1]);
                } else {
                    setSuffix(clean);
                }
            }
        }
    };

    const executeVerify = async (fullCode) => {
        if (!fullCode) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/verify-order?code=${encodeURIComponent(fullCode)}`, {
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

    const handleSubmit = (e) => {
        e?.preventDefault();
        const trimmedSuffix = suffix.trim();
        if (!trimmedSuffix) return;

        const fullCode = `ORD-${year.trim() || currentYear}-${trimmedSuffix}`;
        executeVerify(fullCode);
    };

    const handleReset = () => {
        setSuffix('');
        setResult(null);
        setError(null);
        suffixRef.current?.focus();
    };

    const handleClose = () => {
        stopScanning();
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
                                Введіть код ордера або відскануйте QR-код з бланка
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

                {/* Сканер через камеру */}
                {isScanning && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-2xl border border-emerald-500/40 relative animate-in fade-in">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                Сканування камери активне
                            </span>
                            <button
                                type="button"
                                onClick={stopScanning}
                                className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800"
                            >
                                Закрити камеру
                            </button>
                        </div>
                        <div id="qr-modal-scanner" className="w-full max-w-[280px] mx-auto rounded-xl overflow-hidden bg-black"></div>
                        <p className="text-center text-[11px] text-gray-300 mt-2">
                            Наведіть камеру на QR-код на ордері студента
                        </p>
                    </div>
                )}

                {/* Форма введення коду */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Унікальний код ордера:
                            </label>
                            <button
                                type="button"
                                onClick={isScanning ? stopScanning : startScanning}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                    isScanning
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                <span>{isScanning ? 'Вимкнути сканер' : 'Сканувати QR через камеру'}</span>
                            </button>
                        </div>

                        {/* Фіксовані нестираємі рисочки: ORD - [РІК] - [СУФІКС] */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1 flex items-center gap-2 p-2 bg-slate-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all font-mono">
                                {/* Префікс ORD (фіксований бейдж) */}
                                <span className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-black select-none tracking-wider">
                                    ORD
                                </span>

                                {/* Перша рисочка (нестираєма) */}
                                <span className="text-gray-400 dark:text-gray-500 font-black select-none text-base">
                                    −
                                </span>

                                {/* Рік (4 цифри, за замовчуванням поточний рік) */}
                                <input
                                    ref={yearRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={year}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setYear(v);
                                        if (v.length === 4) {
                                            suffixRef.current?.focus();
                                        }
                                    }}
                                    onPaste={handlePaste}
                                    className="w-14 text-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg py-1 px-0.5 focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white font-mono font-bold text-sm"
                                    placeholder={String(currentYear)}
                                    title="Рік ордера (можна змінити)"
                                />

                                {/* Друга рисочка (нестираєма) */}
                                <span className="text-gray-400 dark:text-gray-500 font-black select-none text-base">
                                    −
                                </span>

                                {/* Суфікс коду (напр. A1B2C3) */}
                                <input
                                    ref={suffixRef}
                                    type="text"
                                    maxLength={8}
                                    value={suffix}
                                    onChange={(e) => setSuffix(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !suffix) {
                                            yearRef.current?.focus();
                                        }
                                    }}
                                    onPaste={handlePaste}
                                    placeholder="XXXXXX"
                                    className="flex-1 bg-transparent border-0 p-1 focus:ring-0 uppercase text-gray-900 dark:text-white font-mono font-bold tracking-widest text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                />

                                {suffix && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-2 py-1 rounded bg-slate-200/60 dark:bg-gray-700 hover:bg-slate-300 transition-colors shrink-0"
                                        title="Стерти код"
                                    >
                                        Стерти
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !suffix.trim()}
                                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
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

                        <p className="text-[11px] text-gray-400 mt-1.5">
                            Рисочки зафіксовані. Ви можете ввести лише останні символи або вставити скопійований код цілком.
                        </p>
                    </div>
                </form>

                {/* Результат перевірки */}
                {result && (
                    <div className="mt-5 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs w-fit">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                ОРДЕР ДІЙСНИЙ ТА СХВАЛЕНИЙ
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
