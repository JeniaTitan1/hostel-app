import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
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
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center px-4 font-sans antialiased">
            <Head title="Авторизація" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200 max-w-md w-full text-center">
                    {status}
                </div>
            )}

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-8 flex flex-col transition-all">
                {/* Логотип та Заголовок */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
                        <ApplicationLogo className="w-7 h-7 fill-current text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight mb-1">
                        Вхід до системи
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                        Введіть свої дані для доступу до панелі керування
                    </p>
                </div>

                {/* Форма авторизації */}
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel htmlFor="email" value="Email" className="text-gray-700 font-semibold mb-1.5" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-xl border-gray-305 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 text-gray-900"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2 text-xs font-medium" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Пароль" className="text-gray-700 font-semibold mb-1.5" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-xl border-gray-305 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 text-gray-900"
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
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                            />
                            <span className="ms-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                                Запам'ятати мене
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                            disabled={processing}
                        >
                            Увійти
                        </PrimaryButton>
                    </div>
                </form>
            </div>

            {/* Копірайт знизу форми */}
            <div className="mt-6 text-xs text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} Система управління. Всі права захищені.
            </div>
        </div>
    );
}
