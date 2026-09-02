import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Відновлення пароля" />

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Забули свій пароль? Не проблема. Вкажіть адресу вашої електронної пошти, і ми надішлемо вам посилання для встановлення нового пароля.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    placeholder="Введіть ваш email"
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-6 flex items-center justify-between">
                    <Link
                        href={route('login')}
                        className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        ← Повернутися до входу
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Надіслати посилання
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
