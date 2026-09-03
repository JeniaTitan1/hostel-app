import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
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
                .catch((err) => console.error('QR code generation failed:', err));
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

        setTilt({ x: rotX, y: rotY, glareX, glareY, opacity: 0.25 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
    };

    // Реагування на гіроскоп / поворот смартфона (DeviceOrientation)
    useEffect(() => {
        if (!show) return;

        const handleOrientation = (e) => {
            if (e.gamma === null || e.beta === null) return;
            // Обмежуємо нахил телефоном
            const gamma = Math.min(Math.max(e.gamma, -25), 25);
            const beta = Math.min(Math.max(e.beta - 45, -25), 25); // середній кут тримання телефону ~45 deg

            const rotY = (gamma / 25) * 12;
            const rotX = -(beta / 25) * 12;

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
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-4 sm:p-6 bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl relative overflow-hidden shadow-2xl border border-emerald-500/20 max-h-[90vh] overflow-y-auto">
                {/* Фоновий легкий градієнтний блік */}
                <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Шапка модалки */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-white leading-tight">
                                Електронна перепустка
                            </h3>
                            <p className="text-[11px] text-emerald-400/90 font-medium">
                                Миколаївський Національний Аграрний Університет
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-xs font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* 3D Картка-перепустка (Apple Wallet Style) */}
                <div
                    className="relative perspective-1000 my-2 flex justify-center"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        ref={cardRef}
                        style={{
                            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                            transition: tilt.opacity === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
                        }}
                        className="w-full max-w-[340px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 rounded-3xl p-5 border border-emerald-400/40 shadow-2xl relative overflow-hidden select-none"
                    >
                        {/* Голографічний світловий відблиск */}
                        <div
                            style={{
                                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(52, 211, 153, 0.45) 0%, transparent 65%)`,
                                opacity: tilt.opacity,
                                transition: 'opacity 0.3s ease',
                            }}
                            className="absolute inset-0 pointer-events-none rounded-3xl z-20"
                        />

                        {/* Верхня плашка картки */}
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400/80">
                                    МНАУ • КАМПУС
                                </div>
                                <div className="text-sm font-black text-white tracking-wide">
                                    ЦИФРОВИЙ ОРДЕР
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                ДІЙСНИЙ
                            </span>
                        </div>

                        {/* Великий QR-код по центру */}
                        <div className="bg-white p-3.5 rounded-2xl shadow-xl mx-auto w-fit border-2 border-emerald-300 relative z-10">
                            {qrUrl ? (
                                <img
                                    src={qrUrl}
                                    alt="QR-код ордера"
                                    className="w-48 h-48 sm:w-52 sm:h-52 block mx-auto object-contain"
                                />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                                    Генерація QR...
                                </div>
                            )}
                        </div>

                        {/* Унікальний код під QR-кодом */}
                        <div className="mt-3.5 text-center relative z-10">
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                Унікальний номер перепустки
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all">
                                <span className="font-mono font-black text-sm text-emerald-300 tracking-widest">
                                    {orderNumber}
                                </span>
                                <button
                                    onClick={handleCopyCode}
                                    className="text-[11px] text-gray-300 hover:text-white underline font-semibold ml-1"
                                    title="Скопіювати код"
                                >
                                    {copied ? '✓ Скопійовано' : 'Копіювати'}
                                </button>
                            </div>
                        </div>

                        {/* Інформація про студента та кімнату */}
                        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-left relative z-10">
                            <div>
                                <div className="text-[9px] uppercase font-semibold text-gray-400">Студент</div>
                                <div className="text-xs font-bold text-white truncate">{user?.name || '-'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] uppercase font-semibold text-gray-400">Кімната</div>
                                <div className="text-xs font-black text-emerald-400">
                                    Поверх {floorNumber} • №{roomNumber}
                                </div>
                            </div>
                            <div className="col-span-2 text-center pt-1 text-[10px] text-gray-400 truncate">
                                {buildingName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Підказка для прохідної */}
                <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">
                    Покажіть цей QR-код на прохідній або охоронцю для миттєвого проходу та отримання ключів.
                </p>

                {/* Дії внизу */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-bold transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Завантажити файл PDF
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md"
                    >
                        Готово
                    </button>
                </div>
            </div>
        </Modal>
    );
}
