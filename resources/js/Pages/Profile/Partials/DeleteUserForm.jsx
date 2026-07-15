import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Видалення акаунта
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Після видалення вашого акаунта всі його ресурси та дані будуть безповоротно видалені. Перед видаленням акаунта завантажте будь-які дані або інформацію, яку ви бажаєте зберегти.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Видалити акаунт
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Ви впевнені, що хочете видалити свій акаунт?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Після видалення вашого акаунта всі його ресурси та дані будуть безповоротно видалені. Будь ласка, введіть свій пароль, щоб підтвердити, що ви хочете назавжди видалити свій акаунт.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Пароль"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Пароль"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Скасувати
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Видалити акаунт
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
