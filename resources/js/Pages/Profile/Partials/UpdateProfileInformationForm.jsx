import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function UpdateProfileInformation({
    user: passedUser,
    mustVerifyEmail,
    status,
    className = '',
}) {
    const { props } = usePage();
    const user = passedUser || props?.auth?.user || { name: '', email: '' };

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            telegram: user.telegram || '',
            phone: user.phone || '',
        });

    // Синхронізуємо локальний стан форми з новими даними пропса користувача
    useEffect(() => {
        setData({
            name: user.name,
            email: user.email,
            telegram: user.telegram || '',
            phone: user.phone || '',
        });
    }, [user.name, user.email, user.telegram, user.phone]);

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Інформація профілю
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Оновіть інформацію профілю вашого акаунта та адресу електронної пошти.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Ім'я" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Електронна пошта (Email)" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="telegram" value="Telegram (нік або посилання)" />

                    <TextInput
                        id="telegram"
                        type="text"
                        className="mt-1 block w-full text-sm"
                        value={data.telegram}
                        onChange={(e) => setData('telegram', e.target.value)}
                        placeholder="@username"
                    />

                    <InputError className="mt-2" message={errors.telegram} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Номер телефону" />

                    <TextInput
                        id="phone"
                        type="text"
                        className="mt-1 block w-full text-sm"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="+380..."
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Ваша адреса електронної пошти не підтверджена.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Натисніть тут, щоб повторно надіслати лист підтвердження.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Нове посилання для підтвердження надіслано на вашу адресу електронної пошти.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Зберегти</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Збережено.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
