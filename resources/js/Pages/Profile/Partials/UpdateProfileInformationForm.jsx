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
    
    const { academic_options } = props;
    const specialties = academic_options?.specialties || [];
    const courses = academic_options?.courses || [];
    const groups = academic_options?.groups || [];

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            gender: user.gender || '',
            specialty: user.specialty || '',
            course: user.course || '',
            group: user.group || '',
            telegram: user.telegram || '',
            phone: user.phone || '',
        });

    // Синхронізуємо локальний стан форми з новими даними пропса користувача
    useEffect(() => {
        setData({
            name: user.name,
            email: user.email,
            gender: user.gender || '',
            specialty: user.specialty || '',
            course: user.course || '',
            group: user.group || '',
            telegram: user.telegram || '',
            phone: user.phone || '',
        });
    }, [user.name, user.email, user.gender, user.specialty, user.course, user.group, user.telegram, user.phone]);

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Інформація профілю
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                    <InputLabel htmlFor="gender" value="Стать" />
                    <div className="flex gap-4 mt-1.5">
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border rounded-xl border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm flex-1 hover:border-emerald-500 transition-colors">
                            <input
                                type="radio"
                                name="gender"
                                value="male"
                                checked={data.gender === 'male'}
                                onChange={(e) => setData('gender', e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-900 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                required
                            />
                            <span>Чоловіча</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border rounded-xl border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm flex-1 hover:border-emerald-500 transition-colors">
                            <input
                                type="radio"
                                name="gender"
                                value="female"
                                checked={data.gender === 'female'}
                                onChange={(e) => setData('gender', e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-900 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            />
                            <span>Жіноча</span>
                        </label>
                    </div>
                    <InputError className="mt-2" message={errors.gender} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <InputLabel htmlFor="specialty" value="Напрям" />
                        <select
                            id="specialty"
                            name="specialty"
                            value={data.specialty}
                            className="mt-1 block w-full text-xs rounded-lg border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:ring-0 p-2.5 h-[38px]"
                            onChange={(e) => setData('specialty', e.target.value)}
                            required
                        >
                            <option value="" disabled>Оберіть напрям</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.specialty} />
                    </div>

                    <div>
                        <InputLabel htmlFor="course" value="Курс" />
                        <select
                            id="course"
                            name="course"
                            value={data.course}
                            className="mt-1 block w-full text-xs rounded-lg border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:ring-0 p-2.5 h-[38px]"
                            onChange={(e) => setData('course', e.target.value)}
                            required
                        >
                            <option value="" disabled>Оберіть курс</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.number}>{c.number}</option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.course} />
                    </div>

                    <div>
                        <InputLabel htmlFor="group" value="Група" />
                        <select
                            id="group"
                            name="group"
                            value={data.group}
                            className="mt-1 block w-full text-xs rounded-lg border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:ring-0 p-2.5 h-[38px]"
                            onChange={(e) => setData('group', e.target.value)}
                            required
                        >
                            <option value="" disabled>Оберіть групу</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.group} />
                    </div>
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
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Ваша адреса електронної пошти не підтверджена.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Натисніть тут, щоб повторно надіслати лист підтвердження.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Збережено.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
