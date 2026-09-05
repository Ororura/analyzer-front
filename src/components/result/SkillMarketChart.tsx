import { useState, type CSSProperties } from 'react';
import { ChartNoAxesColumnIncreasing, Info } from 'lucide-react';
import { evidenceStatusLabels } from '@/lib/analysis-presentation';
import { getChartSkills, type DashboardSkill } from '@/lib/dashboard-data';

export function SkillMarketChart({ skills }: { skills: DashboardSkill[] }) {
  const data = getChartSkills(skills);
  const [dismissed, setDismissed] = useState<string | null>(null);
  return (
    <>
      <h2 className="card-heading">
        Навыки и требования рынка
        <Info size={14} className="ml-auto text-muted-foreground" />
      </h2>
      <div className="chart-legend">
        <span>
          <i />
          Доля вакансий с требованием
        </span>
        <span>Подпись — подтверждение в резюме</span>
      </div>
      {data.length ? (
        <div className="skill-chart" role="group" aria-label="Частота требований к навыкам на рынке">
          <div className="chart-axis" aria-hidden="true">
            {[100, 75, 50, 25, 0].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <div className="chart-columns" style={{ '--skill-count': data.length } as CSSProperties}>
            {data.map((skill) => (
              <div className="chart-column" key={skill.id}>
                <button
                  type="button"
                  className="chart-bar-target"
                  aria-label={`${skill.name}: ${skill.frequency?.toLocaleString('ru-RU')}% вакансий; ${skill.status ? evidenceStatusLabels[skill.status] : 'Нет данных о кандидате'}`}
                  onMouseEnter={() => setDismissed(null)}
                  onFocus={() => setDismissed(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setDismissed(skill.id);
                  }}
                >
                  <span className="market-bar" style={{ height: `${skill.frequency}%` }}>
                    <span className="bar-value">
                      {skill.frequency?.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%
                    </span>
                  </span>
                  {dismissed !== skill.id && (
                    <span className="chart-tooltip" role="tooltip">
                      {skill.name}: встречается в {skill.frequency?.toLocaleString('ru-RU')}% вакансий.{' '}
                      {skill.status ? evidenceStatusLabels[skill.status] : 'Нет данных'}
                    </span>
                  )}
                </button>
                <span className="chart-skill-name">{skill.name}</span>
                <span className="chart-skill-status">
                  {skill.status
                    ? {
                        STRONG: 'Подтверждён',
                        MEDIUM: 'Частично',
                        WEAK: 'Слабое',
                        MENTION_ONLY: 'Упоминание',
                        NOT_FOUND: 'Не найдено',
                      }[skill.status]
                    : 'Нет данных'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chart-empty">
          <ChartNoAxesColumnIncreasing size={30} />
          <p>Нет данных о частоте требований</p>
          <span>Статусы навыков доступны в таблице анализа.</span>
        </div>
      )}
      <div className="sr-only">
        <table>
          <caption>Частота требований рынка и подтверждение навыков</caption>
          <thead>
            <tr>
              <th>Навык</th>
              <th>Доля вакансий</th>
              <th>Подтверждение в резюме</th>
            </tr>
          </thead>
          <tbody>
            {data.map((skill) => (
              <tr key={skill.id}>
                <th scope="row">{skill.name}</th>
                <td>{skill.frequency}%</td>
                <td>{skill.status ? evidenceStatusLabels[skill.status] : 'Нет данных'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function MissingSkills({ skills }: { skills: DashboardSkill[] }) {
  const [expanded, setExpanded] = useState(false);
  const missing = skills.filter((skill) => skill.status && !['STRONG', 'MEDIUM'].includes(skill.status));
  return (
    <section className="glass-card missing-card">
      <h2 className="card-heading">
        Отсутствующие и слабые навыки<span className="count-pill growth">{missing.length}</span>
      </h2>
      <p className="card-caption">Полоса — частота требования в вакансиях</p>
      {missing.length ? (
        <ul className="missing-list">
          {(expanded ? missing : missing.slice(0, 6)).map((skill) => (
            <li key={skill.id}>
              <span className="skill-dot" aria-hidden="true" />
              <span className="missing-name">
                {skill.name}
                <small>{skill.status ? evidenceStatusLabels[skill.status] : 'Нет данных'}</small>
              </span>
              <div className="missing-meter">
                {skill.frequency !== null ? (
                  <>
                    <meter min={0} max={100} value={skill.frequency} aria-label={`${skill.name}: доля вакансий`} />
                    <span>{skill.frequency.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%</span>
                  </>
                ) : (
                  <span className="no-frequency">Нет данных</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card-empty">Слабые навыки не указаны в отчёте</p>
      )}
      {missing.length > 6 && (
        <button className="quiet-link" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Свернуть' : 'Показать все'}
        </button>
      )}
    </section>
  );
}

export function SkillComparisonTable({ skills }: { skills: DashboardSkill[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="glass-card skills-comparison">
      <h2 className="card-heading">
        <ChartNoAxesColumnIncreasing size={16} />
        Сравнение ключевых навыков
        {skills.length > 6 && (
          <button type="button" className="accent-link" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Свернуть' : `Все (${skills.length})`}
          </button>
        )}
      </h2>
      <div className="markdown-table-scroll" role="region" tabIndex={0} aria-label="Сравнение навыков">
        <table className="skills-table">
          <thead>
            <tr>
              <th scope="col">Навык</th>
              <th scope="col">В резюме</th>
              <th scope="col">Доля вакансий</th>
            </tr>
          </thead>
          <tbody>
            {(expanded ? skills : skills.slice(0, 6)).map((skill) => (
              <tr key={skill.id}>
                <th scope="row">{skill.name}</th>
                <td className={skill.status === 'STRONG' ? 'skill-strong' : ''}>
                  {skill.status ? evidenceStatusLabels[skill.status] : 'Нет данных'}
                </td>
                <td>
                  {skill.frequency === null
                    ? 'Нет данных'
                    : `${skill.frequency.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`}
                </td>
              </tr>
            ))}
            {!skills.length && (
              <tr>
                <td colSpan={3}>Недостаточно данных о навыках</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="sr-only">Частота требования не является оценкой уровня владения навыком.</p>
    </section>
  );
}
