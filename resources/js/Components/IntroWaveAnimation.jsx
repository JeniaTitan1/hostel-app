import React, { useEffect, useRef } from "react";

export default function IntroWaveAnimation({ onClose }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        // Cap DPR to 1.25 to prevent performance bottlenecks on 2K/4K high-DPI monitors
        const resizeCanvas = () => {
            const dpr = Math.min(1.25, window.devicePixelRatio || 1);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const width = window.innerWidth;
        const height = window.innerHeight;

        // --- PRE-RENDER BADGE SPRITES TO OFFSCREEN CANVASES ---
        const labelVariants = [
            "МНАУ 🌾",
            "MNAU",
            "🌾 МНАУ",
            "🎓 Hostel",
            "🏠 МНАУ",
            "MNAU 2026",
            "✨ Agro",
            "🌾 Гуртожитки",
            "🎓 МНАУ",
            "🌊 Hostel App",
        ];

        const roundedRect = (c, x, y, w, h, radius) => {
            const r = Math.min(radius, w / 2, h / 2);
            c.beginPath();
            c.moveTo(x + r, y);
            c.arcTo(x + w, y, x + w, y + h, r);
            c.arcTo(x + w, y + h, x, y + h, r);
            c.arcTo(x, y + h, x, y, r);
            c.arcTo(x, y, x + w, y, r);
            c.closePath();
        };

        const badgeSprites = labelVariants.map((text) => {
            const off = document.createElement("canvas");
            const octx = off.getContext("2d");
            const fontSize = 14;
            octx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            const textWidth = octx.measureText(text).width;
            const paddingX = 24;
            const w = Math.ceil(textWidth + paddingX);
            const h = Math.ceil(fontSize * 2.0);

            off.width = w * 2; // High-res offscreen rendering
            off.height = h * 2;
            octx.scale(2, 2);

            // Glassmorphic pill badge background
            octx.fillStyle = "rgba(2, 6, 23, 0.78)";
            octx.strokeStyle = "rgba(167, 243, 208, 0.45)";
            octx.lineWidth = 1.2;
            roundedRect(octx, 1, 1, w - 2, h - 2, (h - 2) / 2);
            octx.fill();
            octx.stroke();

            // Accent glow dot
            octx.beginPath();
            octx.arc(10, 5, 2, 0, Math.PI * 2);
            octx.fillStyle = "rgba(255, 255, 255, 0.5)";
            octx.fill();

            // Text
            octx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            octx.fillStyle = "#ecfdf5";
            octx.textAlign = "center";
            octx.textBaseline = "middle";
            octx.fillText(text, w / 2, h / 2 + 0.5);

            return { canvas: off, width: w, height: h };
        });

        // --- PRE-RENDER BUBBLE SPRITES TO OFFSCREEN CANVASES ---
        const bubbleTypes = [
            { hue: 145, size: 6, hasRing: true },
            { hue: 160, size: 10, hasRing: true },
            { hue: 175, size: 14, hasRing: true },
            { hue: 150, size: 4, hasRing: false },
            { hue: 165, size: 8, hasRing: false },
        ].map((spec) => {
            const off = document.createElement("canvas");
            const octx = off.getContext("2d");
            const dim = Math.ceil(spec.size * 2 + 6);
            off.width = dim * 2;
            off.height = dim * 2;
            octx.scale(2, 2);

            const cx = dim / 2;
            const cy = dim / 2;

            octx.beginPath();
            octx.arc(cx, cy, spec.size, 0, Math.PI * 2);
            octx.fillStyle = `hsla(${spec.hue}, 90%, 75%, 0.45)`;
            octx.fill();

            if (spec.hasRing) {
                octx.lineWidth = 1;
                octx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                octx.stroke();

                octx.beginPath();
                octx.arc(cx - spec.size * 0.3, cy - spec.size * 0.3, spec.size * 0.35, 0, Math.PI * 1.5);
                octx.strokeStyle = "rgba(255, 255, 255, 0.85)";
                octx.stroke();
            }

            return { canvas: off, dim };
        });

        // 1. Initial Bubbles Array
        const bubbles = Array.from({ length: 90 }, () => {
            const spriteObj = bubbleTypes[Math.floor(Math.random() * bubbleTypes.length)];
            const scale = 0.6 + Math.random() * 0.8;
            return {
                sprite: spriteObj.canvas,
                dim: spriteObj.dim * scale,
                x: Math.random() * width,
                y: Math.random() * height,
                vy: 0.7 + Math.random() * 1.4,
                vx: (Math.random() - 0.5) * 0.35,
                alpha: 0.3 + Math.random() * 0.5,
                drift: Math.random() * Math.PI * 2,
                wobbleFreq: 0.8 + Math.random() * 1.4,
            };
        });

        // 2. Initial Floating Labels Array
        const floatingLabels = Array.from({ length: 22 }, (_, index) => {
            const badgeObj = badgeSprites[index % badgeSprites.length];
            const scale = 0.7 + Math.random() * 0.4;
            return {
                sprite: badgeObj.canvas,
                w: badgeObj.width * scale,
                h: badgeObj.height * scale,
                x: Math.random() * (width - 120) + 60,
                y: Math.random() * (height - 80) + 40,
                vy: 0.6 + Math.random() * 1.1,
                vx: (Math.random() - 0.5) * 0.25,
                alpha: 0.3 + Math.random() * 0.5,
                drift: Math.random() * Math.PI * 2,
                rotate: (Math.random() - 0.5) * 0.18,
                pulseOffset: Math.random() * Math.PI * 2,
            };
        });

        // Animation Loop Variables
        let animationFrameId;
        const startTime = performance.now();
        let lastFrameTime = startTime;
        const duration = 3200;
        const fadeOutStart = 2100;
        let phase = 0;

        const animate = (currentTime) => {
            const dt = Math.min(0.04, (currentTime - lastFrameTime) / 1000);
            lastFrameTime = currentTime;

            const elapsed = currentTime - startTime;
            if (elapsed >= duration) {
                cancelAnimationFrame(animationFrameId);
                if (onClose) onClose();
                return;
            }

            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);
            phase += dt * 2.2;

            // Easing
            const introT = Math.min(1, elapsed / 1100);
            const introEase = 1 - Math.pow(1 - introT, 3); // cubic ease out

            const isExiting = elapsed >= fadeOutStart;
            const exitT = isExiting ? Math.min(1, (elapsed - fadeOutStart) / (duration - fadeOutStart)) : 0;
            const exitEase = Math.pow(exitT, 2.5); // accelerating sweep

            // Exit fade multiplier for elements inside wave: smoothly dissolves text & badges with exit wave
            const exitFade = isExiting ? Math.max(0, 1 - Math.pow(exitT, 1.2)) : 1.0;

            // Wave Positions
            const waveTopY = h * (1 - introEase) - 140 - exitEase * (h * 0.6);
            const waveBottomY = isExiting ? (h + 150) - exitEase * (h + 350) : h + 150;

            // Canvas global alpha fade at very end
            if (exitT > 0.8) {
                ctx.globalAlpha = Math.max(0, 1 - (exitT - 0.8) / 0.2);
            } else {
                ctx.globalAlpha = 1.0;
            }

            // --- DRAW FULL SCREEN WAVE LIQUID ---
            if (waveBottomY > waveTopY) {
                ctx.beginPath();
                ctx.moveTo(0, waveBottomY);
                const startY = waveTopY + Math.sin(phase) * 16;
                ctx.lineTo(0, startY);

                const stepX = Math.max(20, Math.floor(w / 45));
                for (let x = 0; x <= w; x += stepX) {
                    const wave1 = Math.sin(x * 0.003 + phase) * 22;
                    const wave2 = Math.cos(x * 0.0065 - phase * 0.6) * 12;
                    const y = waveTopY + wave1 + wave2;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(w, waveBottomY);
                ctx.closePath();

                const waveGrad = ctx.createLinearGradient(0, Math.max(0, waveTopY), 0, Math.min(h, waveBottomY));
                waveGrad.addColorStop(0, "#34d399"); // emerald-400
                waveGrad.addColorStop(0.5, "#10b981"); // emerald-500
                waveGrad.addColorStop(1, "#059669"); // emerald-600

                ctx.fillStyle = waveGrad;
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
                ctx.stroke();
            }

            // --- DRAW BUBBLE SPRITES WITH SYNCHRONIZED EXIT FADE ---
            for (let i = 0; i < bubbles.length; i++) {
                const p = bubbles[i];
                p.y -= p.vy * dt * 60;
                if (isExiting) p.y -= exitEase * 400 * dt;
                p.x += (p.vx + Math.sin(phase * p.wobbleFreq + p.drift) * 0.35) * dt * 60;

                // Screen bounds wrapping
                if (p.y < -60) p.y = h + 40;
                if (p.y > h + 60) p.y = -40;
                if (p.x < -40) p.x = w + 30;
                if (p.x > w + 40) p.x = -30;

                const halfDim = p.dim / 2;
                ctx.globalAlpha = p.alpha * exitFade;
                ctx.drawImage(p.sprite, p.x - halfDim, p.y - halfDim, p.dim, p.dim);
            }

            // --- DRAW EMOJI & MNAU BADGES WITH SYNCHRONIZED EXIT FADE ---
            for (let i = 0; i < floatingLabels.length; i++) {
                const label = floatingLabels[i];
                label.y -= label.vy * dt * 60;
                if (isExiting) label.y -= exitEase * 500 * dt;
                label.x += (label.vx + Math.sin(phase * 0.7 + label.drift) * 0.3) * dt * 60;

                if (label.y < -70) label.y = h + 50;
                if (label.y > h + 70) label.y = -50;
                if (label.x < -100) label.x = w + 80;
                if (label.x > w + 100) label.x = -80;

                const rot = label.rotate + Math.sin(phase * 0.8 + label.drift) * 0.05;

                ctx.save();
                ctx.translate(label.x, label.y);
                ctx.rotate(rot);
                ctx.globalAlpha = label.alpha * exitFade;
                ctx.drawImage(label.sprite, -label.w / 2, -label.h / 2, label.w, label.h);
                ctx.restore();
            }

            // --- DRAW HERO CENTER "MNAU" TITLE WITH SYNCHRONIZED EXIT FADE ---
            const centerX = w * 0.5;
            const centerY = h * 0.38;
            const pop = Math.min(1, elapsed / 800);
            const popEase = 1 - Math.pow(1 - pop, 3);

            const titleOffset = (1 - popEase) * 50;
            const exitTitleShift = exitEase * 140;
            const currentTitleY = centerY - titleOffset - exitTitleShift;
            const heroTitleAlpha = exitFade;

            if (heroTitleAlpha > 0.01) {
                ctx.save();
                ctx.globalAlpha = heroTitleAlpha;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const mainFontSize = Math.min(w * 0.12, 74);
                ctx.font = `900 ${mainFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

                ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
                ctx.lineWidth = 10;
                ctx.strokeText("MNAU", centerX, currentTitleY);

                ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
                ctx.lineWidth = 3;
                ctx.strokeText("MNAU", centerX, currentTitleY);

                ctx.fillStyle = "#ffffff";
                ctx.fillText("MNAU", centerX, currentTitleY);

                ctx.font = `600 ${Math.min(w * 0.035, 16)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                ctx.fillStyle = "rgba(236, 253, 245, 0.92)";
                ctx.fillText("Миколаївський Національний Аграрний Університет", centerX, currentTitleY + mainFontSize * 0.65);

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [onClose]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[99999] pointer-events-none"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
}
