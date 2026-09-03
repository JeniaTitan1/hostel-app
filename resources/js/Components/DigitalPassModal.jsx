import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import QRCode from 'qrcode';
import { generateOrderPdf } from '@/Utils/OrderPdfGenerator';

export default function DigitalPassModal({ show, onClose, booking, user }) {
    const [qrUrl, setQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
    const [qrRotation, setQrRotation] = useState(0);
    const cardRef = useRef(null);

    const orderNumber = booking?.order_number || `ORD-${new Date().getFullYear()}-PENDING`;
    const roomNumber = booking?.room?.room_number || '-';
    const floorNumber = booking?.room?.floor || '-';
    const buildingName = booking?.room?.building?.name || 'Гуртожиток МНАУ';

    // Генерація QR-коду
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

    // Відстеження повороту екрана телефону (Orientation change)
    useEffect(() => {
        if (!show) return;

        const handleOrientationChange = () => {
            let angle = 0;
            if (window.screen?.orientation?.angle !== undefined) {
                angle = window.screen.orientation.angle;
            } else if (typeof window.orientation === 'number') {
                angle = window.orientation;
            }
            // Автоматично повертаємо QR-код відповідно до орієнтації пристрою
            setQrRotation(angle);
        };

        handleOrientationChange();

        if (window.screen?.orientation) {
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        }
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            if (window.screen?.orientation) {
                window.screen.orientation.removeEventListener('change', handleOrientationChange);
            }
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [show]);

    // Інтерактивний 3D-нахил при русі мишки на ПК
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotX = -((mouseY - centerY) / centerY) * 10;
        const rotY = ((mouseX - centerX) / centerX) * 10;

        const glareX = (mouseX / rect.width) * 100;
        const glareY = (mouseY / rect.height) * 100;

        setTilt({ x: rotX, y: rotY, glareX, glareY, opacity: 0.3 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
    };

    // Реагування на гіроскоп смартфона (DeviceOrientation)
    useEffect(() => {
        if (!show) return;

        const handleDeviceTilt = (e) => {
            if (e.gamma === null || e.beta === null) return;
            const gamma = Math.min(Math.max(e.gamma, -25), 25);
            const beta = Math.min(Math.max(e.beta - 45, -25), 25);

            const rotY = (gamma / 25) * 12;
            const rotX = -(beta / 25) * 12;

            const glareX = 50 + (gamma / 25) * 35;
            const glareY = 50 + (beta / 25) * 35;

            setTilt({ x: rotX, y: rotY, glareX, glareY, opacity: 0.35 });
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceTilt, true);
        }

        return () => {
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleDeviceTilt, true);
            }
        };
    }, [show]);

    const handleRotateManual = () => {
        setQrRotation((prev) => (prev + 90) % 360);
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
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all" />
                </TransitionChild>

                {/* 2. Контейнер: на мобільних на весь екран, на десктопі по центру */}
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden sm:p-4">
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
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                                transition: tilt.opacity === 0 ? 'transform 0.5s ease-out' : 'transform 0.08s ease-out',
                            }}
                            className="w-full h-full sm:h-auto sm:max-w-[390px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white rounded-none sm:rounded-3xl border-0 sm:border sm:border-emerald-400/30 shadow-2xl relative overflow-y-auto scrollbar-none flex flex-col justify-between p-5 select-none"
                        >
                            {/* Голографічний світловий відблиск */}
                            <div
                                style={{
                                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(52, 211, 153, 0.45) 0%, transparent 65%)`,
                                    opacity: tilt.opacity,
                                    transition: 'opacity 0.2s ease',
                                }}
                                className="absolute inset-0 pointer-events-none rounded-none sm:rounded-3xl z-20"
                            />

                            {/* Верхня панель: Заголовок та кнопка закриття */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-30">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400/90">
                                            МНАУ • ЕЛЕКТРОННИЙ ПРОПУСК
                                        </div>
                                        <div className="text-xs font-bold text-gray-200">
                                            Цифровий ордер студента
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

                            {/* Тіло картки */}
                            <div className="my-auto py-3 text-center relative z-30">
                                {/* Статус та кнопка швидкого повороту QR */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                        ДІЙСНИЙ ДО ЗАСЕЛЕННЯ
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRotateManual}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[11px] font-semibold transition-all active:scale-95"
                                        title="Повернути QR-код на 90°"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Повернути QR</span>
                                    </button>
                                </div>

                                {/* Великий білий контейнер для QR-коду */}
                                <div className="bg-white p-3 rounded-2xl shadow-2xl mx-auto w-fit border-2 border-emerald-300/80">
                                    {qrUrl ? (
                                        <img
                                            src={qrUrl}
                                            alt="QR-код ордера"
                                            style={{
                                                transform: `rotate(${qrRotation}deg)`,
                                                transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            }}
                                            className="w-48 h-48 sm:w-52 sm:h-52 block object-contain mx-auto select-none pointer-events-none"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                                            Генерація QR...
                                        </div>
                                    )}
                                </div>

                                {/* Унікальний номер коду */}
                                <div className="mt-3">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                        Унікальний код ордера:
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

                            {/* Нижня частина: Дані студента та кімнати */}
                            <div className="relative z-30 pt-3 border-t border-white/10 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-left">
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
                                    <div className="col-span-2 text-center text-[10px] font-medium text-gray-400 truncate">
                                        {buildingName}
                                    </div>
                                </div>

                                <p className="text-center text-[10px] text-gray-400 leading-tight">
                                    Скануйте на прохідній гуртожитку для швидкого проходу
                                </p>

                                {/* Кнопки дій */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleDownloadPdf}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-bold transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>PDF-бланк</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md active:scale-95"
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
