import React, { useState, useEffect } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword = true }) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("darkMode") === "true";
        }
        return false;
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", darkMode);
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("app-theme-change", { detail: { darkMode } })
            );
        }
    }, [darkMode]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            replace: true,
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-gray-100 selection:bg-emerald-500/20 dark:selection:bg-emerald-500/30 transition-colors duration-300 relative overflow-hidden font-sans antialiased">
            <Head title="Авторизація — МНАУ Гуртожитки" />

            {/* М'який живий фон «Ambient Aura Mesh» */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                <div className="absolute inset-0 bg-dot-pattern opacity-25 dark:opacity-10" />
                <div className="absolute -top-32 -left-32 w-[720px] h-[720px] rounded-full bg-gradient-to-br from-emerald-400/14 via-teal-300/8 to-transparent dark:from-emerald-500/16 dark:via-teal-600/10 dark:to-transparent blur-[140px] animate-lava-1" />
                <div className="absolute -bottom-32 -right-32 w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-cyan-400/12 via-sky-300/8 to-transparent dark:from-sky-500/14 dark:via-teal-600/8 dark:to-transparent blur-[140px] animate-lava-2" />
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-teal-400/8 via-emerald-400/5 to-transparent dark:from-emerald-600/8 dark:via-slate-800/10 dark:to-transparent blur-[150px] animate-lava-3" />
            </div>

            {/* Dark Mode Toggle (фіксована у верхньому правому куті) */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    type="button"
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] backdrop-blur-md text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/[0.12] transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer touch-manipulation group"
                    title={darkMode ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <svg className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] group-hover:rotate-45 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* ЛІВА ЧАСТИНА (Презентаційний блок МНАУ — для десктопу) */}
            <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 flex-col justify-between p-10 xl:p-14 relative z-10 border-r border-slate-200/60 dark:border-white/[0.06]">
                {/* Верхній блок: Брендінг університету */}
                <div>
                    <div className="flex items-center gap-3.5 mb-10">
                        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 text-white font-black text-lg shadow-lg shadow-emerald-500/25 ring-1 ring-white/30 dark:ring-white/20">
                            <span className="tracking-tight">М</span>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-300 dark:bg-teal-400 ring-2 ring-white dark:ring-[#0b0f19] animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-black tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-950 dark:from-white dark:via-slate-100 dark:to-emerald-200 bg-clip-text text-transparent">
                                    МНАУ
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Гуртожитки
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Миколаївський національний аграрний університет
                            </p>
                        </div>
                    </div>

                    {/* Головний заголовок та опис */}
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-400/25 mb-5 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                            <span>Єдина цифрова екосистема поселення</span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
                            Сучасний та комфортний простір вашого студентського життя
                        </h1>
                        <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                            Автоматизована система розселення, електронних ордерів, цифрових перепусток та оперативного зв'язку з комендатурою університетського містечка.
                        </p>
                    </div>

                    {/* Сітка функціональних карток */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl">
                        {/* Картка 1: Цифрова перепустка */}
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-md group">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                                🪪
                            </div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                Цифрова перепустка та КПП
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                Безконтактний прохід через турнікети за персональним QR-кодом прямо з телефону.
                            </p>
                        </div>

                        {/* Картка 2: Інтерактивна шахматка */}
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-md group">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-400/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                                🏢
                            </div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                Інтерактивна шахматка
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                Прозорий вибір кімнат, перегляд поверхів, ліжко-місць та сусідів онлайн.
                            </p>
                        </div>

                        {/* Картка 3: Електронні заявки */}
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-md group">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                                ⚡
                            </div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                Ремонти та звернення
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                Миттєве створення тикетів до майстрів та коменданта з відстеженням статусу.
                            </p>
                        </div>

                        {/* Картка 4: Мобільний додаток */}
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-md group">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                                📲
                            </div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                Мобільна адаптивність
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                Швидкий PWA-доступ з будь-якого смартфона без потреби встановлення з App Store.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Нижній підвал презентаційного блоку */}
                <div className="pt-6 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>4 гуртожитки</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span>100% цифровий облік</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span>24/7 доступність</span>
                        </div>
                    </div>
                    <span className="text-[11px]">
                        © {new Date().getFullYear()} МНАУ
                    </span>
                </div>
            </div>

            {/* ПРАВА ЧАСТИНА (Форма входу) */}
            <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative z-10 my-auto">
                {/* Мобільний логотип (відображається лише на планшетах та телефонах) */}
                <div className="lg:hidden flex flex-col items-center mb-6 text-center">
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 text-white font-black text-xl shadow-md shadow-emerald-500/25 ring-1 ring-white/30 dark:ring-white/20 mb-3">
                        <span>М</span>
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-300 ring-2 ring-white dark:ring-[#0b0f19] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                            МНАУ
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Гуртожитки
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Миколаївський національний аграрний університет
                    </p>
                </div>

                {/* Статус повідомлення (якщо є) */}
                {status && (
                    <div className="mb-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 max-w-md w-full text-center shadow-xs">
                        {status}
                    </div>
                )}

                {/* Картка форми авторизації */}
                <div className="w-full max-w-[420px] bg-white/85 dark:bg-[#0c1427]/85 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-7 sm:p-9 transition-all">
                    {/* Заголовок картки */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 mb-2.5">
                            <span>🔐</span>
                            <span>Особистий кабінет</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            Вхід до системи
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                            Введіть електронну пошту та пароль від вашого облікового запису
                        </p>
                    </div>

                    {/* Форма */}
                    <form onSubmit={submit} className="space-y-4">
                        {/* Поле Email */}
                        <div>
                            <InputLabel
                                htmlFor="email"
                                value="Електронна пошта"
                                className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                            />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder="student@mnau.edu.ua"
                                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    onChange={(e) => setData("email", e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5 text-xs" />
                        </div>

                        {/* Поле Пароль */}
                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="Пароль"
                                className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                            />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
                                    autoComplete="current-password"
                                    required
                                    onChange={(e) => setData("password", e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    title={showPassword ? "Приховати пароль" : "Показати пароль"}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1.5 text-xs" />
                        </div>

                        {/* Запам'ятати мене та Забули пароль */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData("remember", e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-gray-700 text-emerald-600 shadow-xs focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="ms-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    Запам'ятати мене
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                >
                                    Забули пароль?
                                </Link>
                            )}
                        </div>

                        {/* Кнопка входу */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Перевірка даних...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Увійти до системи</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Безпека та підтримка */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06] flex flex-col items-center gap-2 text-center">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Безпечний вхід із 256-бітним SSL-шифруванням</span>
                        </div>
                    </div>
                </div>

                {/* Нижня примітка про підтримку */}
                <div className="mt-6 text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-sm">
                    Виникли проблеми зі входом? Зверніться до коменданта свого гуртожитку або напишіть до служби підтримки МНАУ.
                </div>
            </div>
        </div>
    );
}
