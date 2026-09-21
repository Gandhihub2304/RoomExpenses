"use client";

import * as React from "react";
import { PartyPopper } from "lucide-react";

const CONFETTI_COLORS = ["#ec4899", "#a855f7", "#6366f1", "#f59e0b", "#22c55e", "#06b6d4"];

export function GoalUnlockCelebration({
  goalName,
  onDone,
}: {
  goalName: string;
  onDone: () => void;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 20);
    const hideTimer = setTimeout(() => setVisible(false), 4800);
    const doneTimer = setTimeout(onDone, 5300);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confetti = React.useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      onClick={() => setVisible(false)}
    >
      {confetti.map((c) => (
        <span
          key={c.id}
          className="absolute top-[-5%] rounded-sm"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.4,
            backgroundColor: c.color,
            transform: `rotate(${c.rotate}deg)`,
            animation: `goal-confetti-fall ${c.duration}s ease-in ${c.delay}s forwards`,
          }}
        />
      ))}

      <div
        className="relative mx-4 max-w-sm rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 p-8 text-center shadow-2xl transition-all duration-500"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
        }}
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/20 text-white">
          <PartyPopper className="size-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-white">Goal unlocked!</h2>
        <p className="mt-2 text-white/90">
          You&apos;ve saved enough for <span className="font-semibold">&ldquo;{goalName}&rdquo;</span>
          <br />
          You can buy it now! 🎉
        </p>
      </div>

      <style>{`
        @keyframes goal-confetti-fall {
          from {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
