import React, { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";

export default function AnnouncementsTab({
    announcements = [],
    buildings = [],
    isSuperAdmin,
    currentUser,
}) {
    const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteProcessingId, setDeleteProcessingId] = useState(null);

    const form = useForm({
        title: "",
        content: "",
        priority: "info",
        building_id: isSuperAdmin ? "" : (currentUser?.building_id || ""),
        is_pinned: false,
        send_email: false,
    });

    const handleCreateAnnouncement = (e) => {
        e.preventDefault();
        form.post(route("admin.announcements.store"), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleDeleteAnnouncement = (id, title) => {
        if (confirm(`Ви дійсно бажаєте видалити оголошення "${title}"?`)) {
            setDeleteProcessingId(id);
            router.post(
                route("admin.announcements.destroy", id),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setDeleteProcessingId(null),
                }
            );
        }
    };

    const filteredAnnouncements = announcements.filter((a) => {
        if (selectedPriorityFilter !== "all" && a.priority !== selectedPriorityFilter) {
            return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Панель керування та фільтрів */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">
                            Дошка оголошень гуртожитків
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                            Публікація важливих новин, санітарних днів та подій для студентів
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Фільтр терміновості */}
                    <div className="flex items-center bg-slate-100 dark:bg-gray-900 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-gray-700/80 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedPriorityFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                                selectedPriorityFilter === "all"
                                    ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Усі ({announcements.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPriorityFilter("important")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                                selectedPriorityFilter === "important"
                                    ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Важливо</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPriorityFilter("info")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                                selectedPriorityFilter === "info"
                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Інформація</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPriorityFilter("event")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                                selectedPriorityFilter === "event"
                                    ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>Заходи</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Створити оголошення</span>
                    </button>
                </div>
            </div>

            {/* Список оголошень */}
            {filteredAnnouncements.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">Оголошень поки немає</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Натисніть кнопку «Створити оголошення», щоб сповістити студентів про важливі події або санітарні дні.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAnnouncements.map((item) => {
                        const isImportant = item.priority === "important";
                        const isEvent = item.priority === "event";

                        return (
                            <div
                                key={item.id}
                                className={`rounded-2xl border p-5 space-y-3 flex flex-col justify-between transition-all ${
                                    isImportant
                                        ? "bg-red-50/40 dark:bg-gray-800/90 border-red-200 dark:border-red-900/60 border-l-4 border-l-red-500 shadow-xs"
                                        : isEvent
                                        ? "bg-purple-50/40 dark:bg-gray-800/90 border-purple-200 dark:border-purple-900/60 border-l-4 border-l-purple-500 shadow-xs"
                                        : "bg-slate-50/60 dark:bg-gray-800/90 border-slate-200/80 dark:border-gray-700/90 border-l-4 border-l-blue-500 shadow-xs"
                                }`}
                            >
                                <div className="space-y-2.5">
                                    {/* Top Badges */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {item.is_pinned && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                    <span>Закріплено</span>
                                                </span>
                                            )}
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    isImportant
                                                        ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/60"
                                                        : isEvent
                                                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60"
                                                        : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60"
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isImportant ? "bg-red-500 animate-pulse" : isEvent ? "bg-purple-500" : "bg-blue-500"}`} />
                                                <span>{isImportant ? "Важливо" : isEvent ? "Захід" : "Інформація"}</span>
                                            </span>
                                        </div>

                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-gray-700">
                                            <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{item.building_name}</span>
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h4 className="font-bold text-base text-gray-900 dark:text-white leading-snug">
                                        {item.title}
                                    </h4>

                                    {/* Content */}
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        {item.content}
                                    </p>
                                </div>

                                {/* Footer info */}
                                <div className="pt-3 border-t border-slate-200/60 dark:border-gray-700/80 flex items-center justify-between text-[11px] text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-black flex items-center justify-center">
                                            {item.author_name?.charAt(0) || "A"}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block leading-tight">
                                                {item.author_name}
                                            </span>
                                            <span className="text-[9px] text-gray-400 block">
                                                {item.created_at}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={deleteProcessingId === item.id}
                                        onClick={() => handleDeleteAnnouncement(item.id, item.title)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 text-xs font-bold transition-all hover:shadow-2xs active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                                        title="Видалити оголошення"
                                    >
                                        <svg className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>{deleteProcessingId === item.id ? "..." : "Видалити"}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Модальне вікно створення оголошення */}
            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="lg">
                <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center shadow-xs">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                    Публікація нового оголошення
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Оголошення миттєво з'явиться у кабінетах студентів
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Заголовок оголошення:
                            </label>
                            <input
                                type="text"
                                placeholder="напр., Графік планової дезінсекції у Гуртожитку №1..."
                                value={form.data.title}
                                onChange={(e) => form.setData("title", e.target.value)}
                                className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                            {form.errors.title && (
                                <p className="text-xs text-red-500 mt-1">{form.errors.title}</p>
                            )}
                        </div>

                        {/* Priority Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Рівень терміновості:
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => form.setData("priority", "important")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.data.priority === "important"
                                            ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-2xs"
                                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>Важливо</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => form.setData("priority", "info")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.data.priority === "info"
                                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs"
                                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>Інформація</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => form.setData("priority", "event")}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        form.data.priority === "event"
                                            ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-2xs"
                                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span>Захід</span>
                                </button>
                            </div>
                        </div>

                        {/* Target Building */}
                        {isSuperAdmin ? (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Цільовий гуртожиток:
                                </label>
                                <select
                                    value={form.data.building_id}
                                    onChange={(e) => form.setData("building_id", e.target.value)}
                                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Усі гуртожитки (Загальноуніверситетське)</option>
                                    {buildings.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {/* Content */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Текст оголошення:
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Детальний опис події, час, правила або вказівки для студентів..."
                                value={form.data.content}
                                onChange={(e) => form.setData("content", e.target.value)}
                                className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                            {form.errors.content && (
                                <p className="text-xs text-red-500 mt-1">{form.errors.content}</p>
                            )}
                        </div>

                        {/* Pinned Checkbox */}
                        <div className="flex items-center gap-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_pinned}
                                    onChange={(e) => form.setData("is_pinned", e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Закріпити вгорі стрічки оголошень
                                </span>
                            </label>
                        </div>

                        {/* Email broadcast Checkbox */}
                        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.data.send_email}
                                    onChange={(e) => form.setData("send_email", e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>Розіслати це оголошення на пошти студентів (email-розсилка)</span>
                                    </span>
                                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/70 mt-0.5">
                                        {form.data.building_id
                                            ? "Листи отримають усі студенти обраного гуртожитку"
                                            : "Листи отримають усі зареєстровані студенти університетських гуртожитків"}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                            >
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                            >
                                {form.processing ? "Публікація..." : "Опублікувати"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
