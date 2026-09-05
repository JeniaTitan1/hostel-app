import { useState, useEffect } from "react";

const STORAGE_KEY = "mnau_is_mobile_app";

/**
 * Перевіряє, чи поточне середовище є мобільним додатком (PWA Standalone, Android WebView, iOS WKWebView тощо).
 * 
 * Повертає:
 * - true  -> сайт відкрито всередині мобільного додатка
 * - false -> сайт відкрито у звичайному веб-браузері (Chrome, Safari, Firefox тощо на ПК чи телефоні)
 */
export function isMobileAppEnvironment() {
    if (typeof window === "undefined") {
        return false;
    }

    try {
        // 1. Перевірка явних URL-параметрів (зручно для обгорток додатків та тестування)
        if (window.location && window.location.search) {
            const params = new URLSearchParams(window.location.search);

            // Примусовий режим браузера (для налагодження та скидання): ?is_app=0 або ?browser=1
            if (
                params.get("is_app") === "0" ||
                params.get("app") === "0" ||
                params.get("browser") === "1"
            ) {
                sessionStorage.removeItem(STORAGE_KEY);
                return false;
            }

            const appParam = (params.get("app") || "").toLowerCase();
            const isAppParam = (params.get("is_app") || "").toLowerCase();
            const sourceParam = (params.get("source") || "").toLowerCase();
            const platformParam = (params.get("platform") || "").toLowerCase();
            const webviewParam = (params.get("webview") || "").toLowerCase();

            if (
                appParam === "1" ||
                appParam === "true" ||
                isAppParam === "1" ||
                isAppParam === "true" ||
                sourceParam === "app" ||
                sourceParam === "mobile_app" ||
                sourceParam === "pwa" ||
                platformParam === "app" ||
                platformParam === "mobile_app" ||
                webviewParam === "1" ||
                webviewParam === "true"
            ) {
                sessionStorage.setItem(STORAGE_KEY, "true");
                return true;
            }
        }

        // 2. Перевірка прапорця у sessionStorage (зберігає стан під час внутрішньої навігації у додатку)
        if (sessionStorage.getItem(STORAGE_KEY) === "true") {
            return true;
        }

        // 3. PWA Standalone Display Mode (встановлений PWA додаток на Android / iOS / Desktop)
        const isStandalone =
            window.matchMedia?.("(display-mode: standalone)")?.matches ||
            window.matchMedia?.("(display-mode: fullscreen)")?.matches ||
            window.matchMedia?.("(display-mode: minimal-ui)")?.matches ||
            window.navigator?.standalone === true ||
            (typeof document !== "undefined" &&
                document.referrer &&
                document.referrer.startsWith("android-app://"));

        if (isStandalone) {
            return true;
        }

        // 4. Нативні та гібридні мобільні мости (React Native, Flutter, Capacitor, Cordova тощо)
        if (
            typeof window.ReactNativeWebView !== "undefined" ||
            typeof window.flutter_inappwebview !== "undefined" ||
            typeof window.Capacitor !== "undefined" ||
            typeof window.cordova !== "undefined" ||
            typeof window.Ionic !== "undefined" ||
            typeof window.Android !== "undefined" ||
            typeof window.AndroidBridge !== "undefined" ||
            typeof window.JSBridge !== "undefined"
        ) {
            return true;
        }

        // 5. Аналіз User-Agent
        const ua = (window.navigator?.userAgent || "").toLowerCase();

        // 5a. Спеціальні токени мобільного додатка
        if (/hostelapp|mnauapp|campusapp|mobileapp|hostelmobile/i.test(ua)) {
            return true;
        }

        // 5b. Android WebView детекція
        // Android WebView містить '; wv)' або маркер '\bwv\b'.
        // Також WebView має 'Version/X.X' поруч із 'Chrome/X.X'. У звичайному мобільному Chrome на Android токен 'Version/X.X' відсутній.
        const isAndroid = /android/i.test(ua);
        if (isAndroid) {
            const hasWvToken = /\bwv\b/.test(ua) || ua.includes("; wv)");
            const isVersionChrome = /version\/[0-9.]+/i.test(ua) && /chrome\/[0-9.]+/i.test(ua);
            if (hasWvToken || isVersionChrome) {
                return true;
            }
        }

        // 5c. iOS WKWebView детекція
        // У нативному iOS WKWebView за замовчуванням відсутнє слово 'Safari'.
        // Водночас у звичайних браузерах (Safari, Chrome, Firefox, Edge, Opera) на iOS присутні їхні маркери.
        const isIos = /iphone|ipad|ipod/i.test(ua);
        if (isIos) {
            const isStandardBrowser = /safari|crios|fxios|edgios|opr|opt|duckduckgo/i.test(ua);
            if (!isStandardBrowser) {
                return true;
            }

            // Перевірка зареєстрованих обробників у WKWebView
            if (
                window.webkit &&
                typeof window.webkit.messageHandlers === "object" &&
                Object.keys(window.webkit.messageHandlers).length > 0
            ) {
                return true;
            }
        }
    } catch (e) {
        console.warn("Mobile app detection error:", e);
    }

    return false;
}

/**
 * Реактивний React-хук для отримання статусу роботи в мобільному додатку.
 * Автоматично слухає зміну режиму display-mode та подію appinstalled.
 */
export function useIsMobileApp() {
    const [isApp, setIsApp] = useState(() => {
        if (typeof window === "undefined") return false;
        return isMobileAppEnvironment();
    });

    useEffect(() => {
        const updateStatus = () => {
            setIsApp(isMobileAppEnvironment());
        };

        // Запуск перевірки при монтуванні
        updateStatus();

        // Слухаємо зміну медіа-запиту display-mode (standalone)
        const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
        if (mediaQuery?.addEventListener) {
            mediaQuery.addEventListener("change", updateStatus);
        } else if (mediaQuery?.addListener) {
            mediaQuery.addListener(updateStatus);
        }

        window.addEventListener("appinstalled", updateStatus);

        return () => {
            if (mediaQuery?.removeEventListener) {
                mediaQuery.removeEventListener("change", updateStatus);
            } else if (mediaQuery?.removeListener) {
                mediaQuery.removeListener(updateStatus);
            }
            window.removeEventListener("appinstalled", updateStatus);
        };
    }, []);

    return isApp;
}
