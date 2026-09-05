import { ChartNoAxesColumnIncreasing, FileSearch, FileText, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function EmptyResult({ onBack }: { onBack: () => void }) {
  return (
    <div className="empty-dashboard">
      <header className="empty-header">
        <div>
          <span className="eyebrow">ВАШ СЛЕДУЮЩИЙ КАРЬЕРНЫЙ ШАГ</span>
          <h1>Анализ резюме</h1>
          <p>Всё, что поможет сделать ваш опыт заметнее.</p>
        </div>
        <Button onClick={onBack}>
          <Upload size={15} className="mr-2" />
          Загрузить резюме
        </Button>
      </header>
      <section className="glass-card empty-upload">
        <span className="empty-upload-icon">
          <FileSearch size={32} />
        </span>
        <h2>Загрузите резюме для анализа</h2>
        <p>
          Мы сравним навыки, опыт и структуру резюме
          <br />с актуальными требованиями рынка.
        </p>
        <Button onClick={onBack}>
          <Upload size={15} className="mr-2" />
          Загрузить резюме
        </Button>
        <small>PDF · до 10 MB · Java Backend и React Frontend</small>
      </section>
      <div className="overview-grid empty-features">
        {[
          [FileText, 'Сильные стороны и зоны роста', 'Понятная оценка резюме и конкретные рекомендации.'],
          [ChartNoAxesColumnIncreasing, 'Навыки и рынок', 'Требования вакансий и подтверждённый опыт.'],
          [ShieldCheck, 'ATS-проверка', 'Структура, ключевые слова и читаемость документа.'],
        ].map(([Icon, title, description]) => {
          const ItemIcon = Icon as typeof FileText;
          return (
            <section className="glass-card" key={String(title)}>
              <ItemIcon size={20} />
              <h2>{String(title)}</h2>
              <p>{String(description)}</p>
            </section>
          );
        })}
      </div>
      <div className="glass-card empty-report">
        <h2 className="card-heading">Подробный анализ</h2>
        <p>Здесь появятся отчёт, сравнение навыков и рекомендации по улучшению резюме.</p>
        <div className="empty-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
