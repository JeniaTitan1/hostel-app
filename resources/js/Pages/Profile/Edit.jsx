import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                        Налаштування профілю
                    </h2>
                    <p className="text-sm text-gray-500">
                        Керуйте своїми персональними даними, контактами та безпекою
                    </p>
                </div>
            }
        >
            <Head title="Налаштування профілю" />

            <div className="py-8 bg-slate-50/50 dark:bg-gray-900 min-h-[calc(100vh-73px)]">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {auth?.user?.must_change_password && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 dark:border-amber-700 p-4 rounded-xl shadow-xs space-y-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-bold text-amber-800 dark:text-amber-200 text-sm">Обов'язкова первинна реєстрація</span>
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                Ваш акаунт було створено тимчасово. Будь ласка, змініть ваше ім'я, заповніть стать, напрям, курс, групу та телефон, а також оновіть пароль у блоках нижче (Email можна оновити за бажанням). Після виконання цих кроків ви зможете користуватися іншими сторінками сайту.
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] font-bold">
                                <span className={auth?.user?.name && !auth?.user?.name.startsWith('Тимчасовий') && !auth?.user?.name.startsWith('Temporary') ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.name && !auth?.user?.name.startsWith('Тимчасовий') && !auth?.user?.name.startsWith('Temporary') ? '✓' : '✗'} Тимчасове Ім'я (потрібно змінити)
                                </span>
                                <span className="text-gray-500 flex items-center gap-1 font-normal">
                                    ○ Email (необов'язково)
                                </span>
                                <span className={auth?.user?.telegram ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1 font-normal'}>
                                    {auth?.user?.telegram ? '✓' : '○'} Telegram (необов'язково)
                                </span>
                                <span className={auth?.user?.phone ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.phone ? '✓' : '✗'} Телефон ({auth?.user?.phone || 'немає'})
                                </span>
                                <span className={auth?.user?.gender ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.gender ? '✓' : '✗'} Стать
                                </span>
                                <span className={auth?.user?.specialty ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.specialty ? '✓' : '✗'} Напрям
                                </span>
                                <span className={auth?.user?.course ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.course ? '✓' : '✗'} Курс
                                </span>
                                <span className={auth?.user?.group ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.group ? '✓' : '✗'} Група
                                </span>
                                <span className={auth?.user?.password_changed ? 'text-emerald-700 dark:text-emerald-300 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                                    {auth?.user?.password_changed ? '✓' : '✗'} Новий пароль
                                </span>
                            </div>
                        </div>
                    )}

                    {!auth?.user?.must_change_password && auth?.user?.password_changed && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 dark:border-emerald-700 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                    ✓
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Реєстрація успішно завершена!</h4>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Всі обов'язкові поля заповнено та пароль оновлено. Доступ до сайту відкрито.</p>
                                </div>
                            </div>
                            <Link
                                href={auth?.user?.role === 'admin' || auth?.user?.role === 'commandant' ? route('admin.dashboard') : route('dashboard')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all text-center whitespace-nowrap"
                            >
                                Перейти на головну
                            </Link>
                        </div>
                    )}

                    {/* Hero-баннер */}
                    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md border border-emerald-700/30 relative overflow-hidden">
                        <div className="relative z-10 space-y-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-700/60 border border-emerald-500/30 uppercase tracking-wider">
                                Особистий кабінет
                            </span>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight truncate max-w-lg">
                                {auth?.user?.name}
                            </h1>
                            <p className="text-emerald-100 text-xs max-w-xl">
                                Роль у системі: <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-700/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">{auth?.user?.role === 'admin' ? 'Головний Адміністратор' : auth?.user?.role === 'commandant' ? `Комендант ${auth?.user?.building?.name ? '(' + auth.user.building.name + ')' : ''}` : 'Студент'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Редагування профілю */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-6 sm:p-8 rounded-xl shadow-xs">
                            <UpdateProfileInformationForm
                                user={auth?.user}
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        {/* Безпека та видалення */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-6 sm:p-8 rounded-xl shadow-xs">
                                <UpdatePasswordForm />
                            </div>

                            {auth?.user?.role !== 'admin' && (
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-6 sm:p-8 rounded-xl shadow-xs">
                                    <DeleteUserForm />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
