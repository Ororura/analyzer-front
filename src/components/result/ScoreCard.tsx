import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { formatScore, humanizeKey } from '@/lib/analysis-presentation';
import type { ScoreBreakdown } from '@/types/resume-analysis';

interface ScoreCardProps {
  title: string;
  score?: number | null;
  maxScore: 10 | 100;
  description?: string;
  status?: string;
  breakdown?: ScoreBreakdown | null;
}

export function ScoreCard({ title, score, maxScore, description, status, breakdown }: ScoreCardProps) {
  const normalized = score == null ? undefined : Math.max(0, Math.min(100, (score / maxScore) * 100));
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <CardTitle className="text-2xl">{formatScore(score, maxScore)}</CardTitle>
        {status && <p className="text-sm font-medium">{status}</p>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {normalized == null ? (
          <p className="text-sm text-muted-foreground">Недостаточно данных</p>
        ) : (
          <Progress aria-label={`${title}: ${score} из ${maxScore}`} value={normalized} />
        )}
        {breakdown && breakdown.components.length > 0 && <ScoreBreakdownDetails title={title} breakdown={breakdown} />}
      </CardContent>
    </Card>
  );
}

export function ScoreBreakdownDetails({ title, breakdown }: { title: string; breakdown: ScoreBreakdown }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Почему {breakdown.score}/100?
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-3 border-t pt-3" aria-label={`Расчёт: ${title}`}>
          {breakdown.components.map((component, index) => (
            <div key={`${component.name}-${index}`} className="grid grid-cols-[1fr_auto] gap-x-3 text-sm">
              <span className="font-medium">{humanizeKey(component.name)}</span>
              <span>
                {component.score} × {Math.round(component.weight * 100)}% = {component.contribution}
              </span>
              {component.explanation && (
                <span className="col-span-2 text-xs text-muted-foreground">{component.explanation}</span>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
