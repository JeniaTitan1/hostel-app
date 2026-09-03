import React, { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';

export default function VerifyOrder({ auth, initialCode = '', searched = false, booking = null }) {
    const currentYear = new Date().getFullYear();

    // Розбираємо initialCode, якщо передано
    const initialMatch = initialCode.match(/ORD-(\d{4})-([A-Z0-9]+)/i);
    const [year, setYear] = useState(initialMatch ? initialMatch[1] : String(currentYear));
    const [suffix, setSuffix] = useState(
        initialMatch
            ? initialMatch[2]
            : initialCode.replace(/^ORD-\d{4}-/i, '').replace(/^ORD-/i, '')
    );

    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const scannerRef = useRef(null);
    const suffixRef = useRef(null);
    const yearRef = useRef(null);

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
                // ігноруємо
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const startScanning = async () => {
        setScanError(null);
        setIsScanning(true);

        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode('qr-page-scanner');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 240, height: 240 },
                    },
                    (decodedText) => {
                        handleQrSuccess(decodedText);
                    },
                    () => {}
                );
            } catch (err) {
                console.error('Page scanner error:', err);
                setIsScanning(false);
                setScanError('Не вдалося отримати доступ до камери. Перевірте дозволи.');
            }
        }, 150);
    };

    const handleQrSuccess = async (decodedText) => {
        await stopScanning();

        let raw = decodedText.trim();
        if (raw.includes('/verify-order/')) {
            raw = raw.split('/verify-order/').pop();
        }
        raw = raw.split('?')[0].split('#')[0].toUpperCase();

        const match = raw.match(/ORD-(\d{4})-([A-Z0-9]+)/i);
        if (match) {
            setYear(match[1]);
            setSuffix(match[2]);
            router.get(route('verify-order', { orderNumber: `ORD-${match[1]}-${match[2]}` }));
        } else {
            router.get(route('verify-order', { orderNumber: raw }));
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

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmedSuffix = suffix.trim();
        if (!trimmedSuffix) return;

        const fullCode = `ORD-${year.trim() || currentYear}-${trimmedSuffix}`;
        router.get(route('verify-order', { orderNumber: fullCode }));
    };

    const LayoutComponent = auth?.user ? AuthenticatedLayout : GuestLayout;
    const layoutProps = auth?.user ? { user: auth.user } : {};

    return (
        <LayoutComponent {...layoutProps}>
            <Head title="Перевірка автентичності ордера МНАУ" />

            <div className="py-12 bg-slate-50 dark:bg-gray-900 min-h-[calc(100vh-73px)]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Page Card */}
                    <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-black shadow-xs mb-2">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Перевірка справжності ордера на заселення
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Офіційний електронний сервіс Миколаївського Національного Аграрного Університету для перевірки чинності ордерів студента.
                            </p>
                        </div>

                        {/* Кнопка запуску сканера камери */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={isScanning ? stopScanning : startScanning}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    isScanning
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                <span>{isScanning ? 'Вимкнути сканер' : 'Сканувати QR через камеру'}</span>
                            </button>
                        </div>

                        {/* Сканер через камеру */}
                        {isScanning && (
                            <div className="p-4 bg-slate-900 rounded-2xl border border-emerald-500/40 relative animate-in fade-in">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        Сканування активне
                                    </span>
                                    <button
                                        type="button"
                                        onClick={stopScanning}
                                        className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800"
                                    >
                                        Закрити
                                    </button>
                                </div>
                                <div id="qr-page-scanner" className="w-full max-w-[300px] mx-auto rounded-xl overflow-hidden bg-black"></div>
                                <p className="text-center text-xs text-gray-300 mt-2">
                                    Наведіть камеру на QR-код на ордері студента
                                </p>
                            </div>
                        )}

                        {scanError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                {scanError}
                            </div>
                        )}

                        {/* Форма введення з фіксованими рисочками */}
                        <form onSubmit={handleSearch} className="space-y-2">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex items-center gap-2 p-2 bg-slate-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all font-mono">
                                    {/* Префікс ORD */}
                                    <span className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-black select-none tracking-wider">
                                        ORD
                                    </span>

                                    {/* Рисочка */}
                                    <span className="text-gray-400 dark:text-gray-500 font-black select-none text-base">
                                        −
                                    </span>

                                    {/* Рік */}
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
                                        className="w-16 text-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg py-1.5 px-1 focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white font-mono font-bold text-sm"
                                        placeholder={String(currentYear)}
                                        title="Рік ордера"
                                    />

                                    {/* Рисочка */}
                                    <span className="text-gray-400 dark:text-gray-500 font-black select-none text-base">
                                        −
                                    </span>

                                    {/* Суфікс */}
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
                                        className="flex-1 bg-transparent border-0 p-1.5 focus:ring-0 uppercase text-gray-900 dark:text-white font-mono font-bold tracking-widest text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                    />

                                    {suffix && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSuffix('');
                                                suffixRef.current?.focus();
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-2 py-1 rounded bg-slate-200/60 dark:bg-gray-700 hover:bg-slate-300 transition-colors shrink-0"
                                        >
                                            Стерти
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!suffix.trim()}
                                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
                                >
                                    Перевірити
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Рисочки зафіксовані. Введіть останні 6 символів коду або відскануйте QR-код з бланка.
                            </p>
                        </form>

                        {/* Result display */}
                        {searched && booking && (
                            <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-5 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-200/60 dark:border-emerald-800/40">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-black text-sm text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                                            ОРДЕР ДІЙСНИЙ ТА СХВАЛЕНИЙ
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-300/40">
                                        Код: {booking.order_number}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Студент:</span>
                                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{booking.user.name}</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">{booking.user.email}</p>
                                        {booking.user.phone && <p className="text-gray-500 text-xs">Тел: {booking.user.phone}</p>}
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Місце проживання:</span>
                                        <h3 className="font-bold text-base text-emerald-600 dark:text-emerald-400">{booking.room.building.name}</h3>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                                            Поверх {booking.room.floor} • Кімната №{booking.room.room_number}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Академічна інформація:</span>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                            {booking.user.specialty || 'Спеціальність не вказана'}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {booking.user.course ? `${booking.user.course} курс` : ''} {booking.user.group ? `• Група ${booking.user.group}` : ''}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Дата створення ордера:</span>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {booking.created_at}
                                        </p>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-1">
                                            Запис підтверджено в реєстрі МНАУ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {searched && !booking && (
                            <div className="p-6 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-3 animate-fade-in">
                                <div className="w-8 h-8 rounded-xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Ордер не знайдено</div>
                                    <div className="text-rose-600 dark:text-rose-400 mt-0.5">
                                        Перевірте правильність введеного номера ордера або зверніться до коменданта.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LayoutComponent>
    );
}
