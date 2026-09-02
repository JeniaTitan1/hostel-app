import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Підтвердження електронної пошти" />

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Дякуємо за реєстрацію! Перш ніж розпочати, підтвердіть адресу своєї електронної пошти, натиснувши на посилання, яке ми щойно надіслали. Якщо лист не надійшов, ми надішлемо вам інший.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    Нове посилання для підтвердження надіслано на вашу електронну адресу.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Повторно надіслати лист
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        Вийти
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
