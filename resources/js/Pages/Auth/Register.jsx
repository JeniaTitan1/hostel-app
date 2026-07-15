import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Register() {
    const { academic_options } = usePage().props;
    const specialties = academic_options?.specialties || [];
    const courses = academic_options?.courses || [];
    const groups = academic_options?.groups || [];
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        gender: '',
        specialty: '',
        course: '',
        group: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Реєстрація" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Ім'я" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
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
                        </label>
                    </div>
                    <InputError message={errors.gender} className="mt-2" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="col-span-1">
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
                        <InputError message={errors.specialty} className="mt-2" />
                    </div>

                    <div className="col-span-1">
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
                        <InputError message={errors.course} className="mt-2" />
                    </div>

                    <div className="col-span-1">
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
                        <InputError message={errors.group} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
