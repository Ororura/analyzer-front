import { useState } from 'react';
import { ArrowUpRight, Check, CircleAlert, Sparkles } from 'lucide-react';
import type { ResumeAnalysisResult } from '@/types/resume-analysis';
import { levelLabels } from '@/lib/analysis-presentation';

export function ResumeScoreCard({ result }: { result: ResumeAnalysisResult }) {
  const value = Math.max(0, Math.min(100, result.overallScore));
  return (
    <section className="glass-card resume-score">
      <div className="score-ring" role="img" aria-label={`Общая оценка: ${result.overallScore} из 100`}>
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle className="ring-track" cx="70" cy="70" r="60" />
          <circle
            className="ring-value"
            cx="70"
            cy="70"
            r="60"
            pathLength="100"
            strokeDasharray={`${value ?? 0} 100`}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div>
          <strong>{result.overallScore}</strong>
          <span>из 100</span>
        </div>
      </div>
      <div className="score-copy">
        <h2>Общая оценка</h2>
        <p className="score-status">
          {result.overallScore >= 75
            ? 'Хороший результат'
            : result.overallScore >= 50
              ? 'Есть потенциал'
              : 'Требует внимания'}
        </p>
        <p>
          Уровень: <strong>{levelLabels[result.gradeFit?.candidateLevel ?? result.detectedLevel]}</strong>.{' '}
          {result.overallScore >= 75
            ? 'Сильная основа резюме. Точечные улучшения помогут сделать опыт убедительнее.'
            : 'Изучите рекомендации, чтобы усилить резюме и описание опыта.'}
        </p>
      </div>
    </section>
  );
}

export function InsightsCard({ title, items, kind }: { title: string; items: string[]; kind: 'strength' | 'growth' }) {
  const [expanded, setExpanded] = useState(false);
  const limit = kind === 'strength' ? 5 : 4;
  const Icon = kind === 'strength' ? Check : CircleAlert;
  return (
    <section className={`glass-card insights-card ${kind}`}>
      <h2 className="card-heading">
        <span className="insight-icon">
          <Icon size={18} />
        </span>
        {title}
        <span className="count-pill">{items.length}</span>
      </h2>
      {items.length ? (
        <ul>
          {(expanded ? items : items.slice(0, limit)).map((item, index) => (
            <li key={index}>
              {kind === 'strength' ? <Check size={14} /> : <ArrowUpRight size={14} />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card-empty">
          {kind === 'strength' ? 'Сильные стороны не указаны в отчёте' : 'Зоны роста не указаны в отчёте'}
        </p>
      )}
      {items.length > limit && (
        <button className="quiet-link" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Свернуть' : 'Показать все'}
        </button>
      )}
    </section>
  );
}

export function AnalysisSkeleton() {
  return (
    <div aria-busy="true" role="status" aria-label="Анализируем резюме" className="analysis-loading">
      <p className="loading-label">
        <Sparkles size={16} />
        Проверяем навыки, опыт и структуру резюме. Это может занять несколько минут.
      </p>
      <div className="overview-grid">
        {[0, 1, 2].map((item) => (
          <div key={item} className="glass-card skeleton-card">
            <div className={item === 0 ? 'skeleton skeleton-ring' : 'skeleton skeleton-title'} />
            {[0, 1, 2].map((row) => (
              <div key={row} className="skeleton skeleton-line" />
            ))}
          </div>
        ))}
      </div>
      <div className="market-grid">
        {[0, 1, 2].map((item) => (
          <div key={item} className="glass-card skeleton-market">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-chart" />
          </div>
        ))}
      </div>
      <div className="glass-card skeleton-markdown">
        <div className="skeleton skeleton-title" />
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="skeleton skeleton-line" />
        ))}
      </div>
    </div>
  );
}
