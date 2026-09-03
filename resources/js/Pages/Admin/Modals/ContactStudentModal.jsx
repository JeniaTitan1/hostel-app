import React, { useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";

export default function ContactStudentModal({ student, onClose }) {
    if (!student) return null;

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("email"); // "email" | "quick"

    const quickSubjects = [
        "Термінове повідомлення від коменданта",
        "Щодо проживання в кімнаті",
        "Санітарний день та огляд кімнат",
        "Уточнення контактних даних",
        "Попередження про порушення правил розпорядку",
    ];

    const cleanTelegramUsername = (tg) => {
        if (!tg) return "";
        return tg.replace(/^@/, "").trim();
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        window.dispatchEvent(
            new CustomEvent("show-toast", {
                detail: { message: `${label} скопійовано в буфер!` },
            })
        );
    };

    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        const sentSubject = subject.trim();
        const sentMessage = message.trim();

        // Одразу закриваємо модальне вікно
        onClose();

        router.post(
            route("admin.students.contact-email", student.id),
            { subject: sentSubject, message: sentMessage },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const telegramUser = cleanTelegramUsername(student.telegram);

    return createPortal(
        <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Шапка модального вікна */}
                <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                    >
                        ✕
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
                            {student.name ? (
                                student.name.charAt(0).toUpperCase()
                            ) : (
                                <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-white tracking-tight">
                                    {student.name}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                                    Студент
                                </span>
                            </div>
                            <p className="text-xs text-emerald-200/90 font-medium flex items-center gap-2 flex-wrap">
                                <span>{student.email}</span>
                                {student.specialty && (
                                    <>
                                        <span>•</span>
                                        <span>{student.specialty}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Швидкі канали зв'язку */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Канали прямого зв'язку
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Telegram */}
                            <div className="p-3.5 rounded-2xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 flex flex-col justify-between space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-sky-950 dark:text-sky-200">
                                        Telegram
                                    </span>
                                </div>
                                <div>
                                    {telegramUser ? (
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate">
                                                @{telegramUser}
                                            </span>
                                            <a
                                                href={`https://t.me/${telegramUser}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                                            >
                                                <span>Відкрити чат</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Не вказано</span>
                                    )}
                                </div>
                            </div>

                            {/* Телефон */}
                            <div className="p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                        Телефон
                                    </span>
                                </div>
                                <div>
                                    {student.phone ? (
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate">
                                                {student.phone}
                                            </span>
                                            <a
                                                href={`tel:${student.phone}`}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >
                                                <span>Зателефонувати</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Не вказано</span>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                        Email
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 block truncate" title={student.email}>
                                        {student.email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(student.email, "Email")}
                                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        Скопіювати
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Форма відправки листа на пошту */}
                    <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                Надіслати лист на пошту студента
                            </h4>
                        </div>

                        <form onSubmit={handleSendEmail} className="space-y-4">
                            {/* Швидкі шаблони тем */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Швидкий вибір теми:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickSubjects.map((qs) => (
                                        <button
                                            key={qs}
                                            type="button"
                                            onClick={() => setSubject(qs)}
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                                        >
                                            {qs}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Поле теми */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Тема звернення:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Введіть тему повідомлення..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            {/* Поле повідомлення */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Текст листа:
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Напишіть ваше звернення або вказівку для студента..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] text-gray-400 italic">
                                    Лист буде надіслано від імені МNAU на {student.email}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !subject.trim() || !message.trim()}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>{processing ? "Надсилання..." : "Надіслати лист"}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
