import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react';
import { useVacanciesQuery } from '@/hooks/useVacanciesQuery';
import { getInitialVacancyCriteria } from '@/lib/vacancies/profile';
import { getAnalysisProfileLabel } from '@/lib/analysis-profiles';
import { safeExternalUrl } from '@/lib/dashboard-data';
import type { AnalysisProfile } from '@/types/resume-analysis';

export function VacancyMatches({ profile, onViewAll }: { profile: AnalysisProfile; onViewAll?: () => void }) {
  const query = useVacanciesQuery({ ...getInitialVacancyCriteria(), query: getAnalysisProfileLabel(profile) });
  return (
    <section className="glass-card vacancy-matches">
      <h2 className="card-heading">
        Вакансии по профилю
        {onViewAll && (
          <button className="accent-link" onClick={onViewAll}>
            Смотреть все <ArrowRight size={12} />
          </button>
        )}
      </h2>
      {query.isPending ? (
        <div role="status" aria-label="Загрузка вакансий" className="vacancy-rows">
          {[0, 1, 2].map((row) => (
            <div key={row} className="skeleton vacancy-skeleton" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="card-error" role="alert">
          <p>Не удалось загрузить вакансии</p>
          <button
            className="accent-link"
            onClick={() => {
              void query.refetch();
            }}
          >
            Повторить
          </button>
        </div>
      ) : !query.data.items.length ? (
        <p className="card-empty">Вакансий по профилю пока нет. Попробуйте изменить условия поиска.</p>
      ) : (
        <div className="vacancy-rows">
          {query.data.items.slice(0, 3).map((vacancy, index) => {
            const url = safeExternalUrl(vacancy.url);
            return (
              <article className="vacancy-row" key={vacancy.id}>
                <span className={`company-avatar company-${index}`} aria-hidden="true">
                  {vacancy.company?.[0] ?? <BriefcaseBusiness size={18} />}
                </span>
                <div>
                  <h3>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {vacancy.title ?? 'Вакансия'}
                      </a>
                    ) : (
                      (vacancy.title ?? 'Вакансия')
                    )}
                  </h3>
                  <p>{vacancy.company ?? 'Компания не указана'}</p>
                  <small>
                    <MapPin size={11} />
                    {vacancy.location ?? 'Город не указан'}
                    {vacancy.workFormat
                      ? ` · ${{ REMOTE: 'Удалённо', OFFICE: 'Офис', HYBRID: 'Гибрид' }[vacancy.workFormat] ?? vacancy.workFormat}`
                      : ''}
                  </small>
                </div>
                {url && <ArrowRight className="vacancy-arrow" size={13} aria-hidden="true" />}
              </article>
            );
          })}
        </div>
      )}
      <p className="card-caption">Без персональной оценки совпадения.</p>
    </section>
  );
}
