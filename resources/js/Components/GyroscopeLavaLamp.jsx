import React, { useEffect, useRef, useState } from "react";

/**
 * Інтерактивний фон 'Лава-лампа' з фізичною реакцією на гіроскоп смартфона
 * та рух миші на комп'ютері.
 */
export default function GyroscopeLavaLamp({ opacity = 0.65 }) {
    const containerRef = useRef(null);
    const targetTilt = useRef({ x: 0, y: 0 });
    const currentTilt = useRef({ x: 0, y: 0 });
    const [hasPermission, setHasPermission] = useState(true);

    useEffect(() => {
        // 1. Обробник гіроскопа для смартфонів (DeviceOrientation)
        const handleOrientation = (e) => {
            if (e.gamma !== null && e.beta !== null) {
                // gamma: нахил вліво-вправо [-90, 90]
                // beta: нахил вперед-назад [-180, 180]
                const normalizedX = Math.max(-1, Math.min(1, e.gamma / 45));
                const normalizedY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
                targetTilt.current = { x: normalizedX, y: normalizedY };
            }
        };

        // 2. Фолбек для десктопу (рух миші)
        const handleMouseMove = (e) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const normalizedX = (e.clientX - width / 2) / (width / 2);
            const normalizedY = (e.clientY - height / 2) / (height / 2);
            targetTilt.current = { x: normalizedX * 0.7, y: normalizedY * 0.7 };
        };

        // Перевірка підтримки гіроскопа на iOS
        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            // iOS 13+
            window.addEventListener("deviceorientation", handleOrientation);
        } else {
            window.addEventListener("deviceorientation", handleOrientation);
        }

        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        // 3. Анімаційний цикл фізики лави (Lerp 60fps)
        let animationFrameId;
        const blobs = [
            { id: "b1", el: null, baseX: 15, baseY: 20, speed: 0.8, amp: 40, phase: 0 },
            { id: "b2", el: null, baseX: 75, baseY: 30, speed: 0.6, amp: 55, phase: 2 },
            { id: "b3", el: null, baseX: 30, baseY: 70, speed: 0.9, amp: 45, phase: 4 },
            { id: "b4", el: null, baseX: 85, baseY: 80, speed: 0.7, amp: 60, phase: 1.5 },
            { id: "b5", el: null, baseX: 50, baseY: 50, speed: 0.5, amp: 35, phase: 3 },
        ];

        let time = 0;
        const render = () => {
            time += 0.015;

            // Плавне згладжування нахилу (Lerp)
            currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * 0.05;
            currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * 0.05;

            const tiltX = currentTilt.current.x;
            const tiltY = currentTilt.current.y;

            if (containerRef.current) {
                blobs.forEach((blob, idx) => {
                    const el = containerRef.current.querySelector(`#${blob.id}`);
                    if (el) {
                        // Органічний рух лави: хвильовий дрейф + реакція на гіроскоп
                        const driftX = Math.sin(time * blob.speed + blob.phase) * blob.amp;
                        const driftY = Math.cos(time * blob.speed * 0.8 + blob.phase) * (blob.amp * 0.8);

                        // Фізичний зсув під дією нахилу телефона
                        const gyroOffsetX = tiltX * (120 + idx * 25);
                        const gyroOffsetY = tiltY * (120 + idx * 25);

                        const posX = blob.baseX + (driftX + gyroOffsetX) * 0.15;
                        const posY = blob.baseY + (driftY + gyroOffsetY) * 0.15;

                        // Динамічний масштаб крапель при перетіканні
                        const scale = 1 + Math.sin(time * 0.7 + idx) * 0.12 + Math.abs(tiltX) * 0.08;

                        el.style.transform = `translate3d(${posX}vw, ${posY}vh, 0) scale(${scale})`;
                    }
                });
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("deviceorientation", handleOrientation);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-1000"
            style={{ opacity }}
            aria-hidden="true"
        >
            {/* SVG фільтр для ефекту органічного злиття рідких крапель (Metaballs) */}
            <svg className="hidden">
                <defs>
                    <filter id="lava-goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="35" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -8"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            {/* Контейнер крапель лави */}
            <div
                className="w-full h-full relative transform-gpu"
                style={{ filter: "blur(40px)" }}
            >
                {/* Крапля 1: Смарагдове сяйво */}
                <div
                    id="b1"
                    className="absolute -top-32 -left-32 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 opacity-60 dark:opacity-35 mix-blend-multiply dark:mix-blend-screen will-change-transform"
                />

                {/* Крапля 2: Глибокий бірюзовий / циан */}
                <div
                    id="b2"
                    className="absolute top-1/4 -right-24 w-88 h-88 sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-br from-teal-500 via-cyan-600 to-emerald-700 opacity-55 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen will-change-transform"
                />

                {/* Крапля 3: Неоновий м'ятний спалах */}
                <div
                    id="b3"
                    className="absolute -bottom-28 left-1/4 w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 opacity-50 dark:opacity-25 mix-blend-multiply dark:mix-blend-screen will-change-transform"
                />

                {/* Крапля 4: Нічний індиго / глибокий смарагд */}
                <div
                    id="b4"
                    className="absolute bottom-1/3 -right-20 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tl from-emerald-700 via-teal-600 to-slate-800 opacity-45 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen will-change-transform"
                />

                {/* Крапля 5: Центровий м'який акцент */}
                <div
                    id="b5"
                    className="absolute top-1/3 left-1/3 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-500/30 to-cyan-500/20 opacity-40 dark:opacity-20 will-change-transform"
                />
            </div>
        </div>
    );
}
