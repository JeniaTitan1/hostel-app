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
        <Modal show={show} onClose={handleClose} maxWidth="xl">
            <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-100 dark:border-gray-700">
                <style>{`
                    #qr-modal-scanner video {
                        border-radius: 12px !important;
                        object-fit: cover !important;
                        width: 100% !important;
                    }
                    #qr-modal-scanner img {
                        display: none !important;
                    }
                    #qr-modal-scanner div {
                        border: none !important;
                    }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black shadow-xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">
                                Перевірка справжності ордера
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                Введіть код ордера або відскануйте QR-код з бланка
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                        title="Закрити"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Сканер через камеру (Стилізований під світлу тему сайту) */}
                {isScanning && (
                    <div className="mt-5 p-4 bg-emerald-50/50 dark:bg-gray-900/60 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 relative animate-in fade-in space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Сканер камери активний
                            </span>
                            <button
                                type="button"
                                onClick={stopScanning}
                                className="text-xs font-bold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white px-3 py-1 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-2xs hover:bg-slate-50 transition-colors"
                            >
                                Закрити камеру
                            </button>
                        </div>

                        {/* Вікно камери з акуратною білою рамкою */}
                        <div className="mx-auto w-full max-w-[270px] p-2 bg-white dark:bg-gray-800 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-sm">
                            <div id="qr-modal-scanner" className="w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-900"></div>
                        </div>

                        <p className="text-center text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            Наведіть камеру на QR-код на бланку чи смартфоні студента
                        </p>
                    </div>
                )}

                {/* Форма введення коду */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                                Унікальний код ордера:
                            </label>
                            <button
                                type="button"
                                onClick={isScanning ? stopScanning : startScanning}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs whitespace-nowrap ${
                                    isScanning
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                                        : 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                }`}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                <span>{isScanning ? 'Вимкнути сканер' : 'Сканувати через камеру'}</span>
                            </button>
                        </div>

                        {/* Единий безшовний блок з нестираємими рисочками */}
                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                            <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-slate-200 dark:border-gray-700 px-3 py-2 shadow-xs focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all font-mono">
                                {/* Префікс ORD (акцентний бейдж) */}
                                <span className="px-2.5 py-1 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 rounded-lg text-xs font-black select-none tracking-wider shadow-2xs shrink-0">
                                    ORD
                                </span>

                                {/* Перша рисочка (нестираєма) */}
                                <span className="text-slate-300 dark:text-gray-600 font-black text-base select-none px-1.5 shrink-0">
                                    −
                                </span>

                                {/* Рік (4 цифри) */}
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
                                    className="w-12 text-center bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-white font-mono font-bold text-sm sm:text-base shrink-0"
                                    placeholder={String(currentYear)}
                                    title="Рік ордера"
                                />

                                {/* Друга рисочка (нестираєма) */}
                                <span className="text-slate-300 dark:text-gray-600 font-black text-base select-none px-1.5 shrink-0">
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
                                    className="flex-1 min-w-[70px] bg-transparent border-0 p-0 focus:outline-none focus:ring-0 uppercase text-slate-900 dark:text-white font-mono font-black tracking-widest text-sm sm:text-base placeholder:text-slate-300 dark:placeholder:text-gray-600"
                                />

                                {suffix && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors shrink-0 ml-1"
                                        title="Стерти код"
                                    >
                                        Стерти
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !suffix.trim()}
                                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
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

                        <p className="text-[11px] text-slate-400 dark:text-gray-400 mt-1.5 font-medium">
                            Рисочки зафіксовані. Просто введіть останні символи коду або скопіюйте номер повністю.
                        </p>
                    </div>
                </form>

                {/* Результат перевірки */}
                {result && (
                    <div className="mt-5 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs w-fit">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                ОРДЕР ДІЙСНИЙ ТА СХВАЛЕНИЙ
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                                {result.order_number}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-white dark:bg-gray-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Студент:</span>
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{result.user.name}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Гуртожиток:</span>
                                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{result.room.building.name}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Поверх / Кімната:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    Поверх {result.room.floor}, Кімната №{result.room.room_number}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Курс / Група:</span>
                                <span className="font-bold text-slate-800 dark:text-gray-200">
                                    {result.user.course ? `${result.user.course} курс` : '-'} • {result.user.group || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Напрям:</span>
                                <span className="font-semibold text-slate-700 dark:text-gray-300">{result.user.specialty || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Контактний тел:</span>
                                <span className="font-semibold text-slate-700 dark:text-gray-300">{result.user.phone || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold pt-1">
                            <span>Реєстрація: {result.created_at}</span>
                            <span className="font-bold">МНАУ Спеціальний реєстр</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold animate-fade-in">
                        <div className="w-6 h-6 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
