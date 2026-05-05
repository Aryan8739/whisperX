import { useEffect, useRef } from "react";

export function MatrixEffect({ onClose }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
        const fontSize = 16;
        const columns = canvas.width / fontSize;

        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--neon-color").trim() || "#0f0";
            ctx.font = fontSize + "px 'Share Tech Mono'";

            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33);

        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);

        return () => {
            clearInterval(interval);
            window.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    return (
        <div className="matrix-overlay" onClick={onClose}>
            <canvas ref={canvasRef} />
            <div className="matrix-hint">PRESS ESC TO EXIT</div>
        </div>
    );
}
