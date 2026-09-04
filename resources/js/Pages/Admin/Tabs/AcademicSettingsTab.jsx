import React from "react";
import { useForm, router } from "@inertiajs/react";

export default function AcademicSettingsTab({
    specialties = [],
    courses = [],
    groups = [],
    academicPromotionInfo = {},
    triggerConfirm,
}) {
    const specialtyForm = useForm({ name: "" });
    const courseForm = useForm({ number: "" });
    const groupForm = useForm({ name: "" });
    const [isPromoting, setIsPromoting] = React.useState(false);

    const currentYear = academicPromotionInfo?.currentAcademicYear || new Date().getFullYear();
    const yearLabel = `${currentYear}/${currentYear + 1}`;
    const autoPromote = academicPromotionInfo?.autoPromote ?? true;
    const lastPromotedYear = academicPromotionInfo?.lastPromotedYear;
    const lastPromotedDate = academicPromotionInfo?.lastPromotedDate;

    const handlePromoteStudents = () => {
        const confirmMsg = `Ви впевнені, що хочете перевести всіх діючих студентів на наступний курс (+1 курс) для ${yearLabel} навчального року?`;
        const doPromote = () => {
            setIsPromoting(true);
            router.post(route("admin.academic.promote"), { force: true }, {
                onFinish: () => setIsPromoting(false),
            });
        };

        if (triggerConfirm) {
            triggerConfirm(confirmMsg, doPromote);
        } else if (confirm(confirmMsg)) {
            doPromote();
        }
    };

    const handleToggleAutoPromote = () => {
        router.post(route("admin.academic.toggle-auto-promote"));
    };

    return (
        <div className="space-y-6">
            {/* Банер навчального року та переведення студентів (+1 курс з 1 вересня) */}
            <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-950/40 dark:via-gray-800 dark:to-emerald-950/30 border border-indigo-100/80 dark:border-indigo-800/40 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm tracking-wide uppercase">
                                {yearLabel} Навчальний рік
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                                autoPromote 
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" 
                                    : "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600"
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${autoPromote ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                {autoPromote ? "Автопереведення: 1 вересня щороку" : "Автопереведення вимкнено"}
                            </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white pt-1">
                            Щорічне переведення курсів (+1 курс з 1 вересня)
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                            Щороку 1 вересня всі студенти автоматично переходять на наступний курс навчання (1 курс → 2 курс, 2 → 3 тощо). 
                            {lastPromotedYear ? (
                                <span className="block mt-1 text-slate-500 dark:text-gray-400 font-medium">
                                    Останнє переведення проведено для <strong>{lastPromotedYear}/{lastPromotedYear + 1}</strong> навч. року
                                    {lastPromotedDate ? ` (${new Date(lastPromotedDate).toLocaleString('uk-UA')})` : ''}.
                                </span>
                            ) : (
                                <span className="block mt-1 text-slate-500 dark:text-gray-400">
                                    Переведення за поточний період очікується або може бути запущене вручну нижче.
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleAutoPromote}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-2xs text-center"
                        >
                            {autoPromote ? "Вимкнути авто 1 вересня" : "Увімкнути авто 1 вересня"}
                        </button>
                        <button
                            type="button"
                            disabled={isPromoting}
                            onClick={handlePromoteStudents}
                            className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${isPromoting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span>{isPromoting ? "Переведення..." : "Перевести всіх на +1 курс"}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Напрями */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            Напрями навчання
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            Спеціальності або напрями підготовки студентів
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            specialtyForm.post(route("admin.specialties.store"), {
                                onSuccess: () => specialtyForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Напр. КН"
                            value={specialtyForm.data.name}
                            onChange={(e) => specialtyForm.setData("name", e.target.value.toUpperCase())}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={specialtyForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {specialties.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
                                Напрями відсутні
                            </div>
                        ) : (
                            specialties.map((spec) => (
                                <div key={spec.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">{spec.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Ви впевнені, що хочете видалити напрям ${spec.name}?`, () => {
                                                    router.post(route("admin.specialties.destroy", spec.id));
                                                });
                                            } else if (confirm(`Видалити напрям ${spec.name}?`)) {
                                                router.post(route("admin.specialties.destroy", spec.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Курси */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Курси</h3>
                        <p className="text-[11px] text-gray-400">Роки навчання або номери курсів</p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            courseForm.post(route("admin.courses.store"), {
                                onSuccess: () => courseForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Напр. 1"
                            value={courseForm.data.number}
                            onChange={(e) => courseForm.setData("number", e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={courseForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {courses.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">Курси відсутні</div>
                        ) : (
                            courses.map((c) => (
                                <div key={c.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">{c.number} курс</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Видалити курс ${c.number}?`, () => {
                                                    router.post(route("admin.courses.destroy", c.id));
                                                });
                                            } else if (confirm(`Видалити курс ${c.number}?`)) {
                                                router.post(route("admin.courses.destroy", c.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Групи */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Академічні групи</h3>
                        <p className="text-[11px] text-gray-400">Номери або ідентифікатори груп</p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            groupForm.post(route("admin.groups.store"), {
                                onSuccess: () => groupForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Напр. 11"
                            value={groupForm.data.name}
                            onChange={(e) => groupForm.setData("name", e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={groupForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">Групи відсутні</div>
                        ) : (
                            groups.map((g) => (
                                <div key={g.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">Група {g.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Видалити групу ${g.name}?`, () => {
                                                    router.post(route("admin.groups.destroy", g.id));
                                                });
                                            } else if (confirm(`Видалити групу ${g.name}?`)) {
                                                router.post(route("admin.groups.destroy", g.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
