import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import QRCode from 'qrcode';
import { generateOrderPdf } from '@/Utils/OrderPdfGenerator';

export default function DigitalPassModal({ show, onClose, booking, user }) {
    const [qrUrl, setQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
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
                width: 380,
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

        setTilt({ x: rotX, y: rotY, glareX, glareY, opacity: 0.35 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
    };

    // Реагування на легкий нахил смартфона (гіроскоп)
    useEffect(() => {
        if (!show) return;

        const handleOrientation = (e) => {
            if (e.gamma === null || e.beta === null) return;
            const gamma = Math.min(Math.max(e.gamma, -25), 25);
            const beta = Math.min(Math.max(e.beta - 45, -25), 25);

            const rotY = (gamma / 25) * 10;
            const rotX = -(beta / 25) * 10;

            const glareX = 50 + (gamma / 25) * 35;
            const glareY = 50 + (beta / 25) * 35;

            setTilt({ x: rotX, y: rotY, glareX, glareY, opacity: 0.3 });
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        return () => {
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleOrientation, true);
            }
        };
    }, [show]);

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
                {/* 1. Глибокий матовий туманний фон (Backdrop blur) */}
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

                {/* 2. Контейнер для ідеального центрування картки */}
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-3"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-95 translate-y-3"
                    >
                        <DialogPanel
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                                transition: tilt.opacity === 0 ? 'transform 0.5s ease-out' : 'transform 0.08s ease-out',
                            }}
                            className="w-full max-w-[360px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl border border-emerald-400/40 shadow-2xl p-5 relative overflow-hidden select-none"
                        >
                            {/* Голографічний світловий відблиск */}
                            <div
                                style={{
                                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(52, 211, 153, 0.4) 0%, transparent 65%)`,
                                    opacity: tilt.opacity,
                                    transition: 'opacity 0.25s ease',
                                }}
                                className="absolute inset-0 pointer-events-none rounded-3xl z-20"
                            />

                            {/* Фоновий м'який ембіент */}
                            <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                            {/* Верхня плашка: заголовок і статус */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-30 mb-3">
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400/90 leading-tight">
                                        МНАУ • КАМПУС
                                    </div>
                                    <div className="text-xs font-bold text-gray-200">
                                        Цифровий ордер на заселення
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-xs font-bold"
                                    title="Закрити перепустку"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Статус бейдж */}
                            <div className="flex justify-between items-center mb-3 relative z-30 px-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                    ДІЙСНИЙ
                                </span>
                                <span className="text-[11px] font-medium text-emerald-400/90">
                                    Електронна перепустка
                                </span>
                            </div>

                            {/* Великий білий блок для QR-коду */}
                            <div className="bg-white p-3 rounded-2xl shadow-xl mx-auto w-fit border-2 border-emerald-300 relative z-30">
                                {qrUrl ? (
                                    <img
                                        src={qrUrl}
                                        alt="QR-код ордера"
                                        className="w-44 h-44 sm:w-48 sm:h-48 block mx-auto object-contain select-none pointer-events-none"
                                    />
                                ) : (
                                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                                        Генерація QR...
                                    </div>
                                )}
                            </div>

                            {/* Унікальний номер коду з копіюванням */}
                            <div className="mt-3 text-center relative z-30">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                    Унікальний номер ордера:
                                </div>
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all">
                                    <span className="font-mono font-black text-sm text-emerald-300 tracking-widest">
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

                            {/* Інформація про студента та кімнату */}
                            <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-left relative z-30">
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

                            {/* Підказка */}
                            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium relative z-30">
                                Покажіть цей QR-код на прохідній гуртожитку
                            </p>

                            {/* Дії внизу */}
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 relative z-30">
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
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
