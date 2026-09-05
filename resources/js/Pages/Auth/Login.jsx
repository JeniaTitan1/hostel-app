import React, { useState, useEffect, useRef } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { Head, Link, useForm } from "@inertiajs/react";

/**
 * Інтерактивна фонова анімація «Campus Constellation Mesh»:
 * Легкі частинки (вузли кімнат кампусу), які плавно дрейфують та
 * з'єднуються тонкими світловими лініями, створюючи живу цифрову мережу.
 */
function CampusNetworkBackground({ darkMode }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        // Кількість вузлів мережі (адаптивно)
        const particleCount = Math.min(Math.floor((width * height) / 38000), 42);
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                radius: Math.random() * 2 + 1.2,
                alpha: Math.random() * 0.5 + 0.3,
            });
        }

        let isRunning = true;
        const render = () => {
            if (!isRunning) return;
            ctx.clearRect(0, 0, width, height);

            const nodeColor = darkMode
                ? "rgba(52, 211, 153, "
                : "rgba(16, 185, 129, ";
            const lineColor = darkMode
                ? "rgba(45, 212, 191, "
                : "rgba(20, 184, 166, ";

            // Оновлення та малювання вузлів
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${nodeColor}${p.alpha * (darkMode ? 0.6 : 0.45)})`;
                ctx.fill();

                // З'єднання найближчих вузлів лініями
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 135) {
                        const lineAlpha = (1 - dist / 135) * (darkMode ? 0.22 : 0.15);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `${lineColor}${lineAlpha})`;
                        ctx.lineWidth = 0.85;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isRunning = false;
                cancelAnimationFrame(animationFrameId);
            } else {
                isRunning = true;
                render();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [darkMode]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: darkMode ? 0.85 : 0.7 }}
        />
    );
}

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
        <div className="min-h-screen flex flex-col justify-between items-center bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-gray-100 selection:bg-emerald-500/20 dark:selection:bg-emerald-500/30 transition-colors duration-300 relative overflow-hidden font-sans antialiased p-4 sm:p-6 lg:p-8">
            <Head title="Авторизація — МНАУ Гуртожитки" />

            {/* М'яка фонова аура та жива сітка вузлів */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                <div className="absolute inset-0 bg-dot-pattern opacity-25 dark:opacity-10" />

                {/* Верхня смарагдово-м'ятна аура */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-gradient-to-b from-emerald-400/15 via-teal-300/8 to-transparent dark:from-emerald-500/16 dark:via-teal-600/10 dark:to-transparent blur-[140px]" />

                {/* Нижня ціаново-блакитна аура */}
                <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-t from-cyan-400/12 via-teal-300/6 to-transparent dark:from-sky-500/12 dark:via-teal-600/8 dark:to-transparent blur-[150px]" />

                {/* Живий канвас зв'язків кампусу */}
                <CampusNetworkBackground darkMode={darkMode} />
            </div>

            {/* Dark Mode Кнопка перемикача у верхньому куті */}
            <div className="w-full max-w-6xl flex justify-end relative z-30">
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

            {/* ТЕМАТИЧНІ ПЛАВАЮЧІ ЕЛЕМЕНТИ КАМПУСУ НАВКОЛО КАРТКИ (для великих екранів) */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
                {/* 1. Лівий верхній елемент: Академічна конфедератка */}
                <div className="absolute top-[18%] left-[8%] xl:left-[14%] animate-float-1">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg shadow-emerald-500/5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-lg shadow-xs">
                            🎓
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Студентський простір
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                                4 університетські гуртожитки
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Правий верхній елемент: Електронний ключ кімнати */}
                <div className="absolute top-[22%] right-[8%] xl:right-[14%] animate-float-2">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg shadow-teal-500/5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center text-lg shadow-xs">
                            🔑
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Цифровий ключ
                                </span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                                Миттєве заселення онлайн
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Лівий нижній елемент: Безконтактний КПП & QR-код */}
                <div className="absolute bottom-[20%] left-[9%] xl:left-[15%] animate-float-3">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg shadow-emerald-500/5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-lg shadow-xs">
                            🪪
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Перепустка КПП
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                                Безконтактний прохід через турнікет
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Правий нижній елемент: Аграрна специфіка університету */}
                <div className="absolute bottom-[18%] right-[9%] xl:right-[15%] animate-float-4">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg shadow-amber-500/5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center text-lg shadow-xs">
                            🌾
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Кампус МНАУ
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                                Комфорт та студентський затишок
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ГОЛОВНА ЦЕНТРАЛЬНА КАРТКА АВТОРИЗАЦІЇ */}
            <div className="my-auto w-full max-w-[430px] relative z-20 flex flex-col items-center">
                {/* Статус повідомлення (наприклад, після скидання пароля) */}
                {status && (
                    <div className="mb-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 w-full text-center shadow-xs">
                        {status}
                    </div>
                )}

                <div className="w-full bg-white/85 dark:bg-[#0c1427]/85 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] p-8 sm:p-10 transition-all">
                    {/* Фірмовий логотип МНАУ Гуртожитки */}
                    <div className="flex flex-col items-center text-center mb-7">
                        <div className="relative mb-3.5 group">
                            {/* М'яка неонова підсвітка логотипу */}
                            <div className="absolute inset-0 bg-emerald-500/25 rounded-2xl blur-xl transition-all group-hover:bg-emerald-500/35" />
                            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 text-white font-black text-2xl shadow-lg shadow-emerald-500/30 ring-1 ring-white/40 dark:ring-white/20 transition-transform duration-300 group-hover:scale-105">
                                <span>М</span>
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-300 dark:bg-teal-400 ring-2 ring-white dark:ring-[#0c1427] animate-pulse" />
                            </div>
                        </div>

                        {/* Назва МНАУ ГУРТОЖИТКИ */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-950 dark:from-white dark:via-slate-100 dark:to-emerald-200 bg-clip-text text-transparent">
                                МНАУ
                            </span>
                            <span className="text-sm font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                Гуртожитки
                            </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug max-w-xs">
                            Миколаївський національний аграрний університет
                        </p>

                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-400/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Вхід до системи розселення</span>
                        </div>
                    </div>

                    {/* Форма авторизації */}
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
                                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
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
                                    className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
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

                    {/* Безпека */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06] flex flex-col items-center gap-1.5 text-center">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Безпечний вхід із 256-бітним SSL-шифруванням</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* НИЖНІЙ ПІДВАЛ СТОРІНКИ */}
            <div className="w-full max-w-md text-center relative z-20 py-2">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    © {new Date().getFullYear()} Миколаївський національний аграрний університет (МНАУ).
                </p>
                <p className="text-[10px] text-slate-400/80 dark:text-slate-600 mt-0.5">
                    Потрібна допомога? Зверніться до коменданта свого гуртожитку.
                </p>
            </div>
        </div>
    );
}
