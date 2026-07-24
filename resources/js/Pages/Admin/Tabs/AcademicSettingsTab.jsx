import React from "react";
import { useForm, router } from "@inertiajs/react";

export default function AcademicSettingsTab({
    specialties = [],
    courses = [],
    groups = [],
    triggerConfirm,
}) {
    const specialtyForm = useForm({ name: "" });
    const courseForm = useForm({ number: "" });
    const groupForm = useForm({ name: "" });

    return (
        <div className="space-y-6">
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
