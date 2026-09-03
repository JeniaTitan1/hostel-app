import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import QRCode from 'qrcode';
import { generateOrderPdf } from '@/Utils/OrderPdfGenerator';

const PASS_STORAGE_KEY = 'mnau_offline_digital_pass';

export default function DigitalPassModal({ show, onClose, booking, user }) {
    const [qrUrl, setQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [offlineData, setOfflineData] = useState(null);

    // 3D Gyroscope & Card Tilt State
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
    const targetTilt = useRef({ x: 0, y: 0 });
    const currentTilt = useRef({ x: 0, y: 0 });

    const activeBooking = booking || offlineData?.booking;
    const activeUser = user || offlineData?.user;

    const orderNumber = activeBooking?.order_number || `ORD-${new Date().getFullYear()}-PENDING`;
    const roomNumber = activeBooking?.room?.room_number || activeBooking?.room_number || '-';
    const floorNumber = activeBooking?.room?.floor || activeBooking?.floor_number || '-';
    const buildingName = activeBooking?.room?.building?.name || activeBooking?.building_name || 'Гуртожиток МНАУ';

    // 1. Офлайн-кешування перепустки
    useEffect(() => {
        if (booking && user) {
            const dataToSave = {
                booking: {
                    order_number: booking.order_number,
                    room_number: booking.room?.room_number,
                    floor_number: booking.room?.floor,
                    building_name: booking.room?.building?.name,
                },
                user: {
                    name: user.name,
                    email: user.email,
                },
                cachedAt: Date.now(),
            };
            try {
                localStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (e) {
                console.warn('Pass offline cache error:', e);
            }
        } else {
            // Спроба відновити з кешу для офлайн-режиму
            try {
                const cached = localStorage.getItem(PASS_STORAGE_KEY);
                if (cached) {
                    setOfflineData(JSON.parse(cached));
                }
            } catch (e) {}
        }
    }, [booking, user]);

    // 2. Блокування фонового скролу
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [show]);

    // 3. Генерація чіткого QR-коду
    useEffect(() => {
        if (show && (booking || offlineData)) {
            const verifyUrl = `${window.location.origin}/verify-order/${encodeURIComponent(orderNumber)}`;
            QRCode.toDataURL(verifyUrl, {
                width: 360,
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
    }, [show, booking, offlineData, orderNumber]);

    // 4. 3D Інтерактивний нахил картки за гіроскопом або мишею (Apple Wallet 3D Tilt)
    useEffect(() => {
        if (!show) return;

        const handleOrientation = (e) => {
            if (e.gamma !== null && e.beta !== null) {
                // Нахил смартфона
                const normX = Math.max(-1, Math.min(1, e.gamma / 35)); // вліво-вправо
                const normY = Math.max(-1, Math.min(1, (e.beta - 45) / 35)); // вперед-назад
                targetTilt.current = { x: normX, y: normY };
            }
        };

        const handleMouseMove = (e) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const normX = Math.max(-1, Math.min(1, x / (rect.width / 2)));
            const normY = Math.max(-1, Math.min(1, y / (rect.height / 2)));
            targetTilt.current = { x: normX, y: normY };
        };

        const handleTouchMove = (e) => {
            if (!e.touches[0] || !cardRef.current) return;
            const touch = e.touches[0];
            const rect = cardRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            targetTilt.current = {
                x: Math.max(-1, Math.min(1, x / (rect.width / 2))),
                y: Math.max(-1, Math.min(1, y / (rect.height / 2))),
            };
        };

        window.addEventListener('deviceorientation', handleOrientation);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Анімаційний цикл згладжування 3D-повороту
        let frameId;
        const animate = () => {
            currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * 0.08;
            currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * 0.08;

            const rotY = currentTilt.current.x * 14; // градуси
            const rotX = -currentTilt.current.y * 14;
            const glareX = 50 + currentTilt.current.x * 40;
            const glareY = 50 + currentTilt.current.y * 40;

            setTilt({ rotateX: rotX, rotateY: rotY, glareX, glareY });
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(frameId);
        };
    }, [show]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(orderNumber);
        if (navigator.vibrate) navigator.vibrate(20);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPdf = () => {
        if (activeBooking && activeUser) {
            generateOrderPdf({ user: activeUser, booking: activeBooking });
        }
    };

    if (!activeBooking && !offlineData) return null;

    return (
        <Transition show={show} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Легкий матовий фон */}
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" />
                </TransitionChild>

                {/* 3D Контейнер */}
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto scrollbar-none"
                    style={{ perspective: '1200px' }}
                >
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-90 translate-y-6"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-90 translate-y-6"
                    >
                        <DialogPanel
                            ref={cardRef}
                            style={{
                                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.05s ease-out',
                            }}
                            className="w-full max-w-[350px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl border border-emerald-400/40 shadow-[0_25px_60px_-15px_rgba(4,120,87,0.5)] p-4 sm:p-5 relative select-none transform-gpu overflow-hidden"
                        >
                            {/* Голографічний відблиск світла (Apple Wallet Glare) */}
                            <div
                                className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-300 opacity-60 mix-blend-overlay"
                                style={{
                                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.45) 0%, rgba(52,211,153,0.15) 35%, transparent 70%)`,
                                }}
                            />

                            {/* Верхня плашка */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3 relative z-20">
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400/90 leading-tight flex items-center gap-1.5">
                                        <span>МНАУ • КАМПУС</span>
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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

                            {/* Статус-бейдж */}
                            <div className="flex justify-between items-center mb-3 px-0.5 relative z-20">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-xs uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                    ДІЙСНИЙ
                                </span>
                                <span className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-emerald-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Електронна перепустка
                                </span>
                            </div>

                            {/* Великий блок із QR-кодом */}
                            <div className="bg-white p-3 rounded-2xl shadow-2xl mx-auto w-fit border-2 border-emerald-300 relative z-20 transition-transform duration-150 hover:scale-[1.02]">
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
                            <div className="mt-3 text-center relative z-20">
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                    Унікальний номер ордера:
                                </div>
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all">
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
                            <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-left relative z-20">
                                <div>
                                    <div className="text-[9px] uppercase font-bold text-gray-400">Студент</div>
                                    <div className="text-xs font-bold text-white truncate">{activeUser?.name || '-'}</div>
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
                            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium relative z-20">
                                📱 Повертайте телефон для 3D-голограми
                            </p>

                            {/* Кнопки дій */}
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 relative z-20">
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-bold transition-all active:scale-95"
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
