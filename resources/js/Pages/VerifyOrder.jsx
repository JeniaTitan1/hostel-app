import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';

export default function VerifyOrder({ auth, initialCode = '', searched = false, booking = null }) {
    const [code, setCode] = useState(initialCode);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        router.get(route('verify-order', { orderNumber: code.trim() }));
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
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-2xl font-black shadow-xs mb-2">
                                📜
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Перевірка справжності ордера на заселення
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Офіційний електронний сервіс Миколаївського Національного Аграрного Університету для перевірки чинності ордерів студента.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Введіть код ордера (ORD-2026-XXXXXX)"
                                className="flex-1 font-mono text-sm tracking-wider font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3.5 focus:ring-2 focus:ring-emerald-500 uppercase"
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
                            >
                                Перевірити
                            </button>
                        </form>

                        {/* Result display */}
                        {searched && booking && (
                            <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-5 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-200/60 dark:border-emerald-800/40">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                        <span className="font-black text-sm text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                                            ✓ ОРДЕР ДІЙСНИЙ ТА СХВАЛЕНИЙ
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
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Статус та дата:</span>
                                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                            ЗАТВЕРДЖЕНО
                                        </span>
                                        <p className="text-gray-500 text-xs mt-1.5">
                                            Створено: {booking.created_at}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {searched && !booking && (
                            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center space-y-2 animate-fade-in">
                                <div className="text-3xl">❌</div>
                                <h3 className="font-bold text-base text-red-900 dark:text-red-200">
                                    Ордер з кодом "{code}" не знайдено
                                </h3>
                                <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
                                    Перевірте правильність введеного коду або зверніться до коменданта вашого корпусу для уточнення статусу заселення.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LayoutComponent>
    );
}
