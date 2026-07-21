import React from "react";

export default function LayoutFooter() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-8 transition-colors duration-200 relative z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                    {/* Logo & Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm">
                                М
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">
                                МНАУ Гуртожитки
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                            Інформаційна система розселення та бронювання
                            кімнат у гуртожитках Миколаївського
                            національного аграрного університету.
                        </p>
                    </div>

                    {/* Contacts */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Контакти
                        </h4>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                            <li>
                                <strong>Адреса:</strong> вул. Георгія
                                Гонгадзе, 9, м. Миколаїв, 54020
                            </li>
                            <li>
                                <strong>Телефон:</strong>{" "}
                                <a
                                    href="tel:+380512709331"
                                    className="hover:text-emerald-600 transition-colors"
                                >
                                    +38 (0512) 70-93-31
                                </a>
                            </li>
                            <li>
                                <strong>Email:</strong>{" "}
                                <a
                                    href="mailto:rector@mnau.edu.ua"
                                    className="hover:text-emerald-600 transition-colors"
                                >
                                    rector@mnau.edu.ua
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Useful links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Корисні посилання
                        </h4>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                            <li>
                                <a
                                    href="https://www.mnau.edu.ua"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                                >
                                    Офіційний сайт МНАУ
                                    <svg
                                        className="w-3.5 h-3.5 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://registry.edbo.gov.ua/university/348/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-emerald-600 transition-colors"
                                >
                                    Реєстр суб'єктів освітньої діяльності
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                    <span>
                        © {new Date().getFullYear()} Миколаївський
                        національний аграрний университет. Всі права
                        захищені.
                    </span>
                    <span className="font-semibold text-gray-300">
                        ЄДРПОУ 00497213
                    </span>
                </div>
            </div>
        </footer>
    );
}
