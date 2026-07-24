import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function CommandPalette({ isOpen, onClose, users = [], buildings = [], onSelectUser, onSelectRoom }) {
    const [query, setQuery] = useState("");

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (isOpen) onClose();
                else setQuery("");
            }
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredUsers = query.trim()
        ? users.filter(
              (u) =>
                  u.name?.toLowerCase().includes(query.toLowerCase()) ||
                  u.email?.toLowerCase().includes(query.toLowerCase()) ||
                  u.group?.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)
        : [];

    const roomsList = [];
    buildings.forEach((b) => {
        b.rooms?.forEach((r) => {
            if (query.trim() && (r.room_number?.toString().includes(query) || b.name?.toLowerCase().includes(query.toLowerCase()))) {
                roomsList.push({ room: r, building: b });
            }
        });
    });
    const filteredRooms = roomsList.slice(0, 5);

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 md:p-20 bg-slate-950/70 backdrop-blur-md flex justify-center items-start">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 my-auto">
                <div className="relative flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                    <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Швидкий пошук студента, кімнати або корпусу... (ESC для закриття)"
                        className="w-full py-4 text-slate-800 dark:text-slate-100 bg-transparent border-0 focus:ring-0 text-base placeholder-slate-400"
                        autoFocus
                    />
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                    {query.trim() === "" && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Введіть ім'я студента, пошту, групу або номер кімнати для швидкої навігації.
                        </div>
                    )}

                    {filteredUsers.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">Студенти</div>
                            <div className="space-y-1">
                                {filteredUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            onSelectUser(u);
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors text-left group"
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                {u.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {u.email} {u.group ? `• Група ${u.group}` : ""}
                                            </div>
                                        </div>
                                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md">
                                            Редагувати
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredRooms.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">Кімнати та Корпуси</div>
                            <div className="space-y-1">
                                {filteredRooms.map(({ room, building }) => (
                                    <button
                                        key={room.id}
                                        onClick={() => {
                                            onSelectRoom(room, building);
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/80 transition-colors text-left group"
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                Кімната №{room.room_number} ({building.name})
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                Поверх: {room.floor || 1} • Місць: {room.bookings?.length || 0}/{room.max_capacity}
                                            </div>
                                        </div>
                                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md">
                                            Показати на картах
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {query.trim() !== "" && filteredUsers.length === 0 && filteredRooms.length === 0 && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            Нічого не знайдено за запитом "{query}"
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
