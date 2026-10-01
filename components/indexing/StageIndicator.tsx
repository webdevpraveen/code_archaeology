'use client';

interface StageIndicatorProps {
  stages: string[];
  currentStage: number;
  labels: string[];
}

export function StageIndicator({ stages, currentStage, labels }: StageIndicatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isActive = index === currentStage;
          const isComplete = index < currentStage;

          return (
            <div key={stage} className="flex flex-col items-center flex-1">
              {/* Stage Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isComplete ? '✓' : index + 1}
              </div>

              {/* Label */}
              <span className="text-xs text-muted-foreground mt-2 text-center">
                {labels[index] || stage}
              </span>

              {/* Connector */}
              {index < stages.length - 1 && (
                <div
                  className={`h-1 w-full mt-3 transition-colors ${
                    isComplete ? 'bg-green-500' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
