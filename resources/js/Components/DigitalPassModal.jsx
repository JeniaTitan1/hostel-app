import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import QRCode from 'qrcode';
import { generateOrderPdf } from '@/Utils/OrderPdfGenerator';
import { getEcho } from '@/echo';

/**
 * Приємний звуковий сигнал підтвердження проходу
 */
function playApprovalChime() {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        // Мелодійний двотональний акорд схвалення (E5 -> B5)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
        console.warn('Approval chime error:', e);
    }
}

export default function DigitalPassModal({ show, onClose, booking, user }) {
    const [qrUrl, setQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [scanApproved, setScanApproved] = useState(null); // { status: 'granted', type: 'entry' | 'exit' } | null

    const initialTimestampRef = useRef(Date.now());
    const processedLogIdRef = useRef(null);

    const orderNumber = booking?.order_number || `ORD-${new Date().getFullYear()}-PENDING`;
    const roomNumber = booking?.room?.room_number || '-';
    const floorNumber = booking?.room?.floor || '-';
    const buildingName = booking?.room?.building?.name || 'Гуртожиток МНАУ';

    // Блокування фонового скролу сторінки під час відкриття перепустки
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
            initialTimestampRef.current = Date.now();
            setScanApproved(null);
        } else {
            document.body.style.overflow = '';
            setScanApproved(null);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [show]);

    // Генерація чіткого QR-коду високої роздільної здатності
    useEffect(() => {
        if (show && booking) {
            const verifyUrl = `${window.location.origin}/verify-order/${encodeURIComponent(orderNumber)}`;
            QRCode.toDataURL(verifyUrl, {
                width: 480,
                margin: 1,
                color: {
                    dark: '#032d23',
                    light: '#ffffff',
                },
                errorCorrectionLevel: 'H',
            })
                .then((url) => setQrUrl(url))
                .catch((err) => console.error('QR generation error:', err));
        }
    }, [show, booking, orderNumber]);

    // Обробка успішного схвалення проходу
    const triggerApprovalSuccess = (data) => {
        playApprovalChime();

        // Вібрація на смартфонах
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
            window.navigator.vibrate([50, 70, 100]);
        }

        setScanApproved({
            status: data?.status || 'granted',
            type: data?.type || 'entry',
        });
    };

    // ⚡ Real-time WebSocket прослуховування через Laravel Echo
    useEffect(() => {
        if (!show || !user?.id) return;

        const echo = getEcho();
        let userChannel = null;

        if (echo) {
            userChannel = echo.channel(`user.${user.id}`);
            userChannel.listen('.AccessPassScanned', (e) => {
                if (e.status === 'granted') {
                    triggerApprovalSuccess(e);
                }
            });
        }

        // Фоновий опитування-fallback для 100% надійності при повільному інтернеті
        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(route('my-latest-access-log'));
                const data = await res.json();
                if (data.log && data.log.status === 'granted') {
                    const logTime = new Date(data.log.created_at).getTime();
                    // Якщо лог свіжіший, ніж час відкриття перепустки
                    if (
                        logTime >= initialTimestampRef.current - 5000 &&
                        processedLogIdRef.current !== data.log.id
                    ) {
                        processedLogIdRef.current = data.log.id;
                        triggerApprovalSuccess(data.log);
                    }
                }
            } catch (e) {
                // Ігноруємо проміжні мережеві помилки опитування
            }
        }, 2000);

        return () => {
            clearInterval(pollInterval);
            if (echo && user?.id) {
                echo.leaveChannel(`user.${user.id}`);
            }
        };
    }, [show, user?.id]);

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
                {/* 1. Напівпрозорий фон */}
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity" />
                </TransitionChild>

                {/* 2. Контейнер: Fullscreen на мобільних і центрований модал на ПК */}
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto scrollbar-none">
                    <TransitionChild
                        as={React.Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 sm:scale-95 translate-y-4 sm:translate-y-0"
                        enterTo="opacity-100 sm:scale-100 translate-y-0"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 sm:scale-100 translate-y-0"
                        leaveTo="opacity-0 sm:scale-95 translate-y-4 sm:translate-y-0"
                    >
                        <DialogPanel className="w-full h-full sm:h-auto sm:max-w-md bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white sm:rounded-3xl rounded-none border-0 sm:border border-emerald-500/30 shadow-2xl p-5 sm:p-6 flex flex-col justify-between select-none transform-gpu overflow-y-auto scrollbar-none">
                            {/* Верхній рядок з заголовком та кнопкою закриття */}
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                                            QR
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400 leading-tight">
                                                МНАУ • КАМПУС
                                            </div>
                                            <div className="text-xs font-bold text-gray-200">
                                                Цифрова перепустка
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-gray-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
                                        title="Закрити перепустку"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Статус-бейдж */}
                                <div className="flex justify-between items-center mb-3 px-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950 shadow-xs uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                                        ДІЙСНА ПЕРЕПУСТКА
                                    </span>
                                    <span className="text-xs font-medium text-emerald-300">
                                        КПП / Вахта
                                    </span>
                                </div>
                            </div>

                            {/* 📱 Великий повноекранний блок із QR-кодом або АНІМАЦІЄЮ ГАЛОЧКИ */}
                            <div className="my-auto py-2 flex flex-col items-center">
                                <div className="relative bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border-4 border-emerald-400/80 max-w-[280px] sm:max-w-[260px] w-full aspect-square flex items-center justify-center overflow-hidden">
                                    {/* Звичайний QR-код */}
                                    {qrUrl ? (
                                        <img
                                            src={qrUrl}
                                            alt="QR-код ордера"
                                            className={`w-full h-full block object-contain select-none pointer-events-none transition-all duration-300 ${
                                                scanApproved ? 'opacity-10 scale-95 blur-xs' : 'opacity-100 scale-100'
                                            }`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                            Генерація QR...
                                        </div>
                                    )}

                                    {/* ✨ КРАСИВА ЖИВА АНІМАЦІЯ ГАЛОЧКИ ПРИ СКАНУВАННІ НА ВХОДІ/ВИХОДІ */}
                                    {scanApproved && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/95 backdrop-blur-xs animate-checkmark-pop overflow-hidden">
                                            {/* 💫 Спалах і розліт сяйва безпосередньо від самої галочки */}
                                            <div className="absolute w-28 h-28 rounded-full border-4 border-white/80 animate-check-flash pointer-events-none" />
                                            <div className="absolute w-40 h-40 rounded-full border border-emerald-200/60 animate-check-flash pointer-events-none" style={{ animationDelay: '0.35s' }} />

                                            {/* Анімована кругла галочка SVG з прямим світінням від ліній */}
                                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-check-glow">
                                                <svg
                                                    className="w-full h-full"
                                                    viewBox="0 0 100 100"
                                                    fill="none"
                                                >
                                                    {/* Круг */}
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="44"
                                                        stroke="white"
                                                        strokeWidth="7"
                                                        strokeLinecap="round"
                                                        className="animate-check-circle"
                                                    />
                                                    {/* Пташка (галочка) */}
                                                    <path
                                                        d="M28 52 L43 67 L73 35"
                                                        stroke="white"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="animate-check-tick"
                                                    />
                                                </svg>

                                                {/* Розлітні спалахи-промені від галочки */}
                                                <div className="absolute inset-0 pointer-events-none animate-check-sparkle flex items-center justify-center">
                                                    <div className="w-1.5 h-6 bg-white rounded-full absolute -top-2 opacity-90" />
                                                    <div className="w-1.5 h-6 bg-white rounded-full absolute -bottom-2 opacity-90" />
                                                    <div className="h-1.5 w-6 bg-white rounded-full absolute -left-2 opacity-90" />
                                                    <div className="h-1.5 w-6 bg-white rounded-full absolute -right-2 opacity-90" />
                                                </div>
                                            </div>

                                            {/* М'який акуратний індикатор напрямку знизу */}
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                <span>{scanApproved.type === 'entry' ? 'ВХІД' : 'ВИХІД'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Номер ордера */}
                                <div className="mt-3 text-center">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all">
                                        <span className="font-mono font-black text-sm sm:text-base text-emerald-300 tracking-widest">
                                            {orderNumber}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="text-[11px] text-gray-200 hover:text-white font-bold underline ml-1 cursor-pointer"
                                            title="Скопіювати код ордера"
                                        >
                                            {copied ? '✓ Скопійовано' : 'Копіювати'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Нижня частина: Дані студента та кнопки дій */}
                            <div>
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 grid grid-cols-2 gap-2 text-left mb-3">
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
                                    <div className="col-span-2 text-center text-[10px] font-semibold text-gray-300 truncate pt-1 border-t border-white/5">
                                        {buildingName}
                                    </div>
                                </div>

                                <p className="text-center text-[11px] text-emerald-200/90 mb-3 font-medium">
                                    {scanApproved ? 'Прохід зафіксовано!' : 'Наведіть цей екран на камеру КПП або покажіть вахтеру'}
                                </p>

                                {/* Кнопки */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadPdf}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-gray-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>PDF-бланк</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
                                    >
                                        {scanApproved ? 'Закрити' : 'Готово'}
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
