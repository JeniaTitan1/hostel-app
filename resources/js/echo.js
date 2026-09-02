import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echoInstance = null;

/**
 * Отримати єдиний інстанс Laravel Echo (Singleton)
 */
export const getEcho = () => {
    if (echoInstance) {
        return echoInstance;
    }

    const host = import.meta.env.VITE_REVERB_HOST || (typeof window !== "undefined" ? window.location.hostname : "localhost");
    const port = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT, 10) : 8080;
    const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
    const key = import.meta.env.VITE_REVERB_APP_KEY || "hostel_reverb_key";

    try {
        echoInstance = new Echo({
            broadcaster: "reverb",
            key: key,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === "https",
            enabledTransports: ["ws", "wss"],
            disableStats: true,
        });
    } catch (err) {
        console.warn("[WebSockets] Помилка ініціалізації Laravel Echo:", err);
    }

    return echoInstance;
};

export default getEcho;
