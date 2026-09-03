import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import QRCode from 'qrcode';
import { generateOrderPdf } from '@/Utils/OrderPdfGenerator';

export default function DigitalPassModal({ show, onClose, booking, user }) {
    const [qrUrl, setQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [gyroAngle, setGyroAngle] = useState(0);
    const prevAngleRef = useRef(0);

    const orderNumber = booking?.order_number || `ORD-${new Date().getFullYear()}-PENDING`;
    const roomNumber = booking?.room?.room_number || '-';
    const floorNumber = booking?.room?.floor || '-';
    const buildingName = booking?.room?.building?.name || 'Гуртожиток МНАУ';

    // 1. Блокування повороту екрана на мобільних при відкритті
    useEffect(() => {
        if (show) {
            // Блокуємо поворот екрана у портретний режим
            if (window.screen?.orientation?.lock) {
                window.screen.orientation.lock('portrait-primary').catch(() => {
                    window.screen.orientation.lock('portrait').catch(() => {});
                });
            }
            // Блокуємо скрол сторінки позаду модалки
            document.body.style.overflow = 'hidden';
        } else {
            if (window.screen?.orientation?.unlock) {
                try {
                    window.screen.orientation.unlock();
                } catch (e) {}
            }
            document.body.style.overflow = '';
        }

        return () => {
            if (window.screen?.orientation?.unlock) {
                try {
                    window.screen.orientation.unlock();
                } catch (e) {}
            }
            document.body.style.overflow = '';
        };
    }, [show]);

    // 2. Генерація QR-коду
    useEffect(() => {
        if (show && booking) {
            const verifyUrl = `${window.location.origin}/verify-order/${encodeURIComponent(orderNumber)}`;
            QRCode.toDataURL(verifyUrl, {
                width: 440,
                margin: 1,
                color: {
                    dark: '#044e3a',
                    light: '#ffffff',
                },
                errorCorrectionLevel: 'H',
            })
                .then((url) => setQrUrl(url))
                .catch((err) => console.error('QR generation error:', err));
        }
    }, [show, booking, orderNumber]);

    // 3. Відстеження гіроскопа з високою точністю для плавного руху QR-коду
    useEffect(() => {
        if (!show) return;

        const handleDeviceOrientation = (e) => {
            const { gamma, beta, alpha } = e;
            if (gamma === null || beta === null) return;

            let angle = 0;

            // Якщо телефон лежить майже горизонтально плазом (beta < 20), використовуємо compass alpha
            if (Math.abs(beta) < 20 && alpha !== null) {
                angle = -alpha;
            } else {
                // Точний кут нахилу телефону в площині екрана (як кермо в руках)
                const rad = Math.atan2(gamma, beta);
                angle = -(rad * (180 / Math.PI));
            }

            // Плавне згладжування переходу через 180/-180
            let diff = angle - prevAngleRef.current;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;

            const smoothed = prevAngleRef.current + diff;
            prevAngleRef.current = smoothed;

            setGyroAngle(smoothed);
        };

        // Запит дозволу для iOS 13+ при наявності API
        if (
            typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            // iOS вимагає жест користувача, підключаємо слухач після дозволу
            const requestAndListen = () => {
                DeviceOrientationEvent.requestPermission()
                    .then((perm) => {
                        if (perm === 'granted') {
                            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
                        }
                    })
                    .catch(() => {});
                window.removeEventListener('touchstart', requestAndListen);
            };
            window.addEventListener('touchstart', requestAndListen, { once: true });
        } else if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        }

        return () => {
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
            }
        };
    }, [show]);

    // На ПК: рух мишки злегка відхиляє QR-код для інтерактивного ефекту
    const handleMouseMove = (e) => {
        if (window.DeviceOrientationEvent && 'ontouchstart' in window) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const angle = (mouseX / (rect.width / 2)) * 14;
        setGyroAngle(angle);
    };

    const handleMouseLeave = () => {
        if (window.DeviceOrientationEvent && 'ontouchstart' in window) return;
        setGyroAngle(0);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(orderNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPdf = () => {
        if (booking && user) {
            generateOrderPdf({ user, booking });
        }
    };

    if (!booking) return null;

    return (
        <Transition show={show} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* 1. Туманний темний фон (Backdrop blur) */}
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl transition-all" />
                </TransitionChild>

                {/* 2. Контейнер: на мобільних телефонах на повний екран (full screen), на ПК по центру */}
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-0 sm:p-4">
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
                    >
                        <DialogPanel
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="w-full h-full sm:h-auto sm:max-w-[400px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white rounded-none sm:rounded-3xl border-0 sm:border sm:border-emerald-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none"
                            style={{
                                maxHeight: '100dvh',
                                transform: 'none', // Текст і картка 100% статичні
                            }}
                        >
                            {/* Фонова ембіент-ілюмінація */}
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                            {/* Верхня панель (повністю статична) */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400/90 leading-tight">
                                            МНАУ • ЕЛЕКТРОННА ПЕРЕПУСТКА
                                        </div>
                                        <div className="text-xs font-bold text-gray-200">
                                            Цифровий ордер на заселення
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-xs font-bold"
                                    title="Закрити перепустку"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Центральна зона: Тільки QR-код реагує на гіроскоп, решта тексту статична */}
                            <div className="my-auto py-2 flex flex-col items-center justify-center text-center relative z-10">
                                {/* Статус поселення */}
                                <div className="mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                        ДІЙСНИЙ ДО ЗАСЕЛЕННЯ
                                    </span>
                                </div>

                                {/* Контейнер QR-коду з гіроскопічною анімацією */}
                                <div className="relative p-1.5 rounded-3xl bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-emerald-500/30 border border-emerald-400/50 shadow-2xl">
                                    <div className="bg-white p-3 sm:p-3.5 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                        {qrUrl ? (
                                            <img
                                                src={qrUrl}
                                                alt="QR-код ордера"
                                                style={{
                                                    transform: `rotate(${gyroAngle}deg)`,
                                                    transition: 'transform 0.08s cubic-bezier(0.1, 0.9, 0.2, 1)',
                                                    willChange: 'transform',
                                                }}
                                                className="w-48 h-48 sm:w-52 sm:h-52 block object-contain select-none pointer-events-none"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                                                Генерація QR...
                                            </div>
                                        )}
                                    </div>

                                    {/* Міні-індикатор живого гіроскопа */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/90 border border-emerald-400/40 rounded-full text-[9px] font-extrabold text-emerald-400 tracking-wider flex items-center gap-1 shadow-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        GYRO LIVE
                                    </div>
                                </div>

                                {/* Унікальний номер коду (статичний) */}
                                <div className="mt-4">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                        Унікальний номер ордера:
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all">
                                        <span className="font-mono font-black text-sm sm:text-base text-emerald-300 tracking-widest">
                                            {orderNumber}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="text-[11px] text-gray-200 hover:text-white font-bold underline ml-1"
                                            title="Скопіювати код ордера"
                                        >
                                            {copied ? '✓ Скопійовано' : 'Копіювати'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Нижня панель: Інформація про студента та кімнату (повністю статична) */}
                            <div className="relative z-10 pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                                <div className="grid grid-cols-2 gap-2 text-left bg-white/5 p-3 rounded-2xl border border-white/10">
                                    <div>
                                        <div className="text-[9px] uppercase font-bold text-gray-400">Студент</div>
                                        <div className="text-xs font-bold text-white truncate">{user?.name || '-'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase font-bold text-gray-400">Кімната</div>
                                        <div className="text-xs font-black text-emerald-400">
                                            Поверх {floorNumber} • №{roomNumber}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center text-[10px] font-semibold text-gray-300 truncate pt-0.5 border-t border-white/5">
                                        {buildingName}
                                    </div>
                                </div>

                                <p className="text-center text-[10px] text-gray-400 leading-tight">
                                    Скануйте на прохідній гуртожитку для швидкого проходу
                                </p>

                                {/* Кнопки дій */}
                                <div className="flex items-center gap-2 pt-0.5">
                                    <button
                                        type="button"
                                        onClick={handleDownloadPdf}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-bold transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>PDF-бланк</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md active:scale-95"
                                    >
                                        Готово
                                    </button>
                                </div>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
