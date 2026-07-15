import Checkbox from '@/Components/Checkbox';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
            <Head title="Авторизація" />
            {/* Dark mode toggle */}
            <div className="absolute top-4 right-4 z-55">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    type="button"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-150 shadow-xs"
                    title={darkMode ? 'Світла тема' : 'Темна тема'}
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </button>
            </div>


            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200 max-w-md w-full text-center">
                    {status}
                </div>
            )}

            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 flex flex-col transition-all relative">
                {/* Логотип та Заголовок (университетский стиль) */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800/30 shadow-xs">
                        <span className="text-2xl font-black tracking-tight">М</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">МНАУ Гуртожитки</span>
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-white tracking-tight mb-2 max-w-xs leading-snug">
                        Миколаївський національний аграрний університет
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Введіть свої дані для авторизації в системі розселення
                    </p>
                </div>

                {/* Форма авторизації */}
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-gray-700 dark:text-gray-300 font-semibold mb-1.5" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2 text-xs font-medium" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Пароль" className="text-gray-700 dark:text-gray-300 font-semibold mb-1.5" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2 text-xs font-medium" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer select-none">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 shadow-xs focus:ring-emerald-500"
                            />
                            <span className="ms-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                Запам'ятати мене
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                            disabled={processing}
                        >
                            Увійти
                        </PrimaryButton>
                    </div>
                </form>
            </div>

            {/* Копірайт знизу форми */}
            <div className="mt-6 text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center leading-relaxed">
                © {new Date().getFullYear()} Миколаївський національний аграрний університет (МНАУ).<br />
                Всі права захищені.
            </div>
        </div>
    );
}
