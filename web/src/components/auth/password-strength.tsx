import { cn } from "@/lib/utils";

function scorePassword(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-chart-2",
  "bg-success",
];

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              i < score && COLORS[score],
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{LABELS[score]}</p>
    </div>
  );
}
