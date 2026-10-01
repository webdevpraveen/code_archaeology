'use client';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  label,
  animated = true,
}: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
      )}

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full bg-primary transition-all ${
            animated ? 'duration-500' : ''
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
