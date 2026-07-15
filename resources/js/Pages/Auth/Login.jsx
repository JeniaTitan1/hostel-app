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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 font-sans antialiased">
            <Head title="Авторизація" />

            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200 max-w-md w-full text-center">
                    {status}
                </div>
            )}

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-8 flex flex-col transition-all">
                {/* Логотип та Заголовок (университетский стиль) */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                        <span className="text-2xl font-black tracking-tight">М</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">МНАУ Гуртожитки</span>
                    <h2 className="text-lg font-extrabold text-gray-950 tracking-tight mb-2 max-w-xs leading-snug">
                        Миколаївський національний аграрний університет
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">
                        Введіть свої дані для авторизації в системі розселення
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
                            className="mt-1 block w-full rounded-xl border-gray-200 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50/50 text-gray-900 text-sm"
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
                            className="mt-1 block w-full rounded-xl border-gray-200 shadow-xs focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50/50 text-gray-900 text-sm"
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
                            <span className="ms-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors">
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
            <div className="mt-6 text-[10px] text-gray-400 font-medium text-center leading-relaxed">
                © {new Date().getFullYear()} Миколаївський національний аграрний університет (МНАУ).<br />
                Всі права захищені.
            </div>
        </div>
    );
}
