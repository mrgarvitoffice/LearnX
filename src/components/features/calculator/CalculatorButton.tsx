
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalculatorButtonConfig } from '@/lib/types';

interface CalculatorButtonProps {
  config: CalculatorButtonConfig;
  onClick: (value: string, type: CalculatorButtonConfig['type'], action?: string) => void;
  isModeActive?: boolean;
}

export function CalculatorButton({ config, onClick, isModeActive = false }: CalculatorButtonProps) {
  const getVariant = () => {
    if (config.type === 'action' || config.type === 'scientific' || config.type === 'operator') return 'secondary';
    if (config.type === 'digit' || config.type === 'decimal') return 'outline';
    return 'default'; // For equals
  };

  return (
    <Button
      variant={getVariant()}
      onClick={() => onClick(config.value, config.type, config.action)}
      className={cn(
        "text-base md:text-lg h-12 md:h-14 active:scale-95 transition-transform font-semibold",
        isModeActive && "bg-accent text-accent-foreground",
        config.className
      )}
      aria-label={config.label || config.value}
    >
      {config.label || config.value}
    </Button>
  );
}
