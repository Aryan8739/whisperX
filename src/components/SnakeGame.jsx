import { useEffect, useState, useCallback, useRef } from "react";

export function SnakeGame({ onClose }) {
    const GRID_SIZE = 20;
    const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState({ x: 5, y: 5 });
    const [dir, setDir] = useState({ x: 0, y: -1 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const gameLoopRef = useRef();

    const moveSnake = useCallback(() => {
        if (gameOver) return;

        const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // Walls
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            setGameOver(true);
            return;
        }

        // Self collision
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            setGameOver(true);
            return;
        }

        const newSnake = [newHead, ...snake];

        // Food
        if (newHead.x === food.x && newHead.y === food.y) {
            setScore(s => s + 10);
            setFood({
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            });
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [snake, dir, food, gameOver]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case "ArrowUp": if (dir.y === 0) setDir({ x: 0, y: -1 }); break;
                case "ArrowDown": if (dir.y === 0) setDir({ x: 0, y: 1 }); break;
                case "ArrowLeft": if (dir.x === 0) setDir({ x: -1, y: 0 }); break;
                case "ArrowRight": if (dir.x === 0) setDir({ x: 1, y: 0 }); break;
                case "Escape": onClose(); break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        gameLoopRef.current = setInterval(moveSnake, 150);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            clearInterval(gameLoopRef.current);
        };
    }, [moveSnake, dir, onClose]);

    return (
        <div className="game-overlay">
            <div className="game-box">
                <div className="game-header">SNAKE_v1.0 - SCORE: {score}</div>
                <div className="game-grid">
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isSnake = snake.some(s => s.x === x && s.y === y);
                        const isFood = food.x === x && food.y === y;
                        return (
                            <div 
                                key={i} 
                                className={`grid-cell ${isSnake ? "snake" : ""} ${isFood ? "food" : ""}`}
                            />
                        );
                    })}
                </div>
                {gameOver && <div className="game-over">GAME OVER! PRESS ESC</div>}
                <div className="game-hint">ARROWS TO MOVE | ESC TO EXIT</div>
            </div>
        </div>
    );
}
