import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createAnalysisProfile, updateAnalysisProfile } from '@/lib/api/analysis-profiles';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { analysisProfilesQueryKey } from '@/hooks/useAnalysisProfiles';
import {
  CANDIDATE_GRADES,
  CAREER_DIRECTIONS,
  WORK_FORMATS,
  type AnalysisProfileDto,
  type MarketFilters,
  type ProfileRequest,
} from '@/types/analysis-profile';

type PresetId = 'JAVA_BACKEND' | 'REACT_FRONTEND';
const presetDefaults: Record<PresetId, Pick<ProfileRequest, 'direction' | 'specialization' | 'targetGrade' | 'technologies'>> = {
  JAVA_BACKEND: { direction: 'BACKEND', specialization: 'Java', targetGrade: 'JUNIOR', technologies: ['Java', 'Spring Boot'] },
  REACT_FRONTEND: { direction: 'FRONTEND', specialization: 'React', targetGrade: 'JUNIOR', technologies: ['React', 'TypeScript'] },
};
const labels: Record<string, string> = {
  BACKEND: 'Backend', FRONTEND: 'Frontend', MOBILE: 'Mobile', DEVOPS: 'DevOps', QA: 'QA', DATA: 'Data', ML: 'ML',
  INTERN: 'Intern', JUNIOR: 'Junior', JUNIOR_PLUS: 'Junior+', MIDDLE: 'Middle', MIDDLE_PLUS: 'Middle+', SENIOR: 'Senior',
  REMOTE: 'Удалённо', OFFICE: 'Офис', HYBRID: 'Гибрид',
};

interface FormState {
  name: string;
  preset: '' | PresetId;
  direction: string;
  specialization: string;
  targetGrade: string;
  technologies: string;
  location: string;
  employer: string;
  employment: string;
  schedule: string;
  workFormat: string;
  salaryFrom: string;
  salaryTo: string;
  currency: string;
  salaryOnly: boolean;
  publishedFrom: string;
  searchGrade: string;
  includeUnknownGrade: boolean;
}

const emptyState: FormState = {
  name: '', preset: '', direction: 'BACKEND', specialization: '', targetGrade: 'JUNIOR', technologies: '',
  location: '', employer: '', employment: '', schedule: '', workFormat: '', salaryFrom: '', salaryTo: '', currency: '',
  salaryOnly: false, publishedFrom: '', searchGrade: '', includeUnknownGrade: false,
};
const csv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const fromProfile = (profile: AnalysisProfileDto): FormState => ({
  name: profile.name,
  preset: profile.preset === 'JAVA_BACKEND' ? 'JAVA_BACKEND' : profile.preset === 'REACT_FRONTEND' ? 'REACT_FRONTEND' : '',
  direction: profile.direction,
  specialization: profile.specialization,
  targetGrade: profile.targetGrade,
  technologies: profile.technologies.join(', '),
  location: profile.marketFilters?.location ?? '', employer: profile.marketFilters?.employer ?? '',
  employment: (profile.marketFilters?.employment ?? []).join(', '), schedule: (profile.marketFilters?.schedule ?? []).join(', '),
  workFormat: profile.marketFilters?.workFormat ?? '', salaryFrom: profile.marketFilters?.salaryFrom?.toString() ?? '',
  salaryTo: profile.marketFilters?.salaryTo?.toString() ?? '', currency: profile.marketFilters?.currency ?? '',
  salaryOnly: profile.marketFilters?.salaryOnly ?? false, publishedFrom: profile.marketFilters?.publishedFrom ?? '',
  searchGrade: profile.marketFilters?.searchGrade ?? '', includeUnknownGrade: profile.marketFilters?.includeUnknownGrade ?? false,
});

export function ProfileForm({ profile, onDone, onDirtyChange }: {
  profile?: AnalysisProfileDto;
  onDone: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => profile ? fromProfile(profile) : emptyState);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (request: ProfileRequest) => profile
      ? updateAnalysisProfile(profile.id, profile.version, request)
      : createAnalysisProfile(request),
    onSuccess: async () => {
      setDirty(false);
      onDirtyChange(false);
      await queryClient.invalidateQueries({ queryKey: analysisProfilesQueryKey });
      onDone();
    },
  });
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Укажите название профиля.';
    else if (form.name.trim().length > 120) next.name = 'Максимум 120 символов.';
    if (!form.specialization.trim()) next.specialization = 'Укажите специализацию.';
    else if (form.specialization.trim().length > 80) next.specialization = 'Максимум 80 символов.';
    const technologies = csv(form.technologies);
    if (!technologies.length) next.technologies = 'Добавьте хотя бы одну технологию.';
    else if (technologies.length > 30) next.technologies = 'Максимум 30 технологий.';
    if (technologies.some((value) => value.length > 80)) next.technologies = 'Название технологии — максимум 80 символов.';
    if (form.location.length > 200) next.location = 'Максимум 200 символов.';
    if (form.employer.length > 200) next.employer = 'Максимум 200 символов.';
    const employment = csv(form.employment);
    if (employment.length > 10 || employment.some((value) => value.length > 100)) next.employment = 'Максимум 10 значений по 100 символов.';
    const schedule = csv(form.schedule);
    if (schedule.length > 10 || schedule.some((value) => value.length > 100)) next.schedule = 'Максимум 10 значений по 100 символов.';
    if (form.currency.length > 10) next.currency = 'Максимум 10 символов.';
    if (form.salaryFrom && Number(form.salaryFrom) < 0) next.salaryFrom = 'Значение не может быть отрицательным.';
    if (form.salaryTo && Number(form.salaryTo) < 0) next.salaryTo = 'Значение не может быть отрицательным.';
    if (form.salaryFrom && form.salaryTo && Number(form.salaryFrom) > Number(form.salaryTo)) next.salaryTo = 'Максимальная зарплата должна быть не меньше минимальной.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const request = useMemo<ProfileRequest>(() => {
    const marketFilters: MarketFilters = {
      location: form.location.trim() || undefined, employer: form.employer.trim() || undefined,
      employment: csv(form.employment), schedule: csv(form.schedule), workFormat: form.workFormat || undefined,
      salaryFrom: form.salaryFrom ? Number(form.salaryFrom) : undefined, salaryTo: form.salaryTo ? Number(form.salaryTo) : undefined,
      currency: form.currency.trim() || undefined, salaryOnly: form.salaryOnly, publishedFrom: form.publishedFrom || undefined,
      searchGrade: form.searchGrade || undefined, includeUnknownGrade: form.includeUnknownGrade,
    };
    return {
      name: form.name.trim(), ...(form.preset ? { preset: form.preset } : {}), direction: form.direction,
      specialization: form.specialization.trim(), targetGrade: form.targetGrade, technologies: csv(form.technologies), marketFilters,
    };
  }, [form]);
  const applyPreset = (preset: PresetId) => {
    if (dirty && !window.confirm('Применение preset заменит направление, специализацию, grade и технологии. Продолжить?')) return;
    const defaults = presetDefaults[preset];
    setForm((current) => ({ ...current, preset, direction: defaults.direction!, specialization: defaults.specialization!, targetGrade: defaults.targetGrade!, technologies: defaults.technologies!.join(', ') }));
    setDirty(true);
  };
  const goBack = () => { if (!dirty || window.confirm('Есть несохранённые изменения. Уйти без сохранения?')) onDone(); };
  return (
    <div className="profile-page">
      <button type="button" className="quiet-link profile-back" onClick={goBack}><ArrowLeft size={16} /> К списку</button>
      <header className="empty-header"><h1>{profile ? 'Редактирование профиля' : 'Новый профиль анализа'}</h1><p>Настройте целевой рынок и технологии. Параметры можно изменить позже.</p></header>
      <form className="profile-form" onSubmit={(event) => { event.preventDefault(); if (validate()) mutation.mutate(request); }} noValidate>
        <section className="glass-card profile-section"><h2>Basic</h2>
          <Field label="Название профиля" id="profile-name" error={errors.name}><Input id="profile-name" value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} /></Field>
          <div className="profile-fields">
            <Field label="Preset" id="profile-preset"><select id="profile-preset" value={form.preset} disabled={Boolean(profile)} onChange={(e) => e.target.value && applyPreset(e.target.value as PresetId)}><option value="">Без preset</option><option value="JAVA_BACKEND">Java Backend</option><option value="REACT_FRONTEND">React Frontend</option></select></Field>
            <Field label="Направление" id="profile-direction"><EnumSelect id="profile-direction" value={form.direction} values={CAREER_DIRECTIONS} onChange={(v) => set('direction', v)} /></Field>
            <Field label="Специализация" id="profile-specialization" error={errors.specialization}><Input id="profile-specialization" value={form.specialization} maxLength={80} onChange={(e) => set('specialization', e.target.value)} aria-invalid={Boolean(errors.specialization)} /></Field>
            <Field label="Target grade" id="profile-grade"><EnumSelect id="profile-grade" value={form.targetGrade} values={CANDIDATE_GRADES} onChange={(v) => set('targetGrade', v)} /></Field>
          </div>
        </section>
        <section className="glass-card profile-section"><h2>Technologies</h2><p className="profile-hint">Технологии, выбранные для профиля. Навыки из резюме и market snapshot показываются отдельно в результате анализа.</p>
          <Field label="Технологии профиля" id="profile-technologies" error={errors.technologies} hint="Через запятую, максимум 30. Backend хранит единый список без primary/additional."><Input id="profile-technologies" value={form.technologies} onChange={(e) => set('technologies', e.target.value)} aria-invalid={Boolean(errors.technologies)} /></Field>
        </section>
        <section className="glass-card profile-section"><h2>Market settings</h2><div className="profile-fields">
          <Field label="Регион" id="profile-location" error={errors.location}><Input id="profile-location" value={form.location} maxLength={200} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Работодатель" id="profile-employer" error={errors.employer}><Input id="profile-employer" value={form.employer} maxLength={200} onChange={(e) => set('employer', e.target.value)} /></Field>
          <Field label="Формат работы" id="profile-work-format"><EnumSelect id="profile-work-format" value={form.workFormat} values={WORK_FORMATS} empty="Любой" onChange={(v) => set('workFormat', v)} /></Field>
          <Field label="Типы занятости" id="profile-employment" error={errors.employment} hint="Значения backend-провайдера через запятую"><Input id="profile-employment" value={form.employment} onChange={(e) => set('employment', e.target.value)} /></Field>
          <Field label="Графики работы" id="profile-schedule" error={errors.schedule} hint="Значения backend-провайдера через запятую"><Input id="profile-schedule" value={form.schedule} onChange={(e) => set('schedule', e.target.value)} /></Field>
          <Field label="Search grade" id="profile-search-grade"><EnumSelect id="profile-search-grade" value={form.searchGrade} values={CANDIDATE_GRADES} empty="Как target grade" onChange={(v) => set('searchGrade', v)} /></Field>
          <Field label="Зарплата от" id="profile-salary-from" error={errors.salaryFrom}><Input id="profile-salary-from" type="number" min="0" value={form.salaryFrom} onChange={(e) => set('salaryFrom', e.target.value)} /></Field>
          <Field label="Зарплата до" id="profile-salary-to" error={errors.salaryTo}><Input id="profile-salary-to" type="number" min="0" value={form.salaryTo} onChange={(e) => set('salaryTo', e.target.value)} /></Field>
          <Field label="Валюта" id="profile-currency" error={errors.currency}><Input id="profile-currency" value={form.currency} maxLength={10} onChange={(e) => set('currency', e.target.value)} /></Field>
          <Field label="Опубликовано после" id="profile-published-from"><Input id="profile-published-from" type="date" value={form.publishedFrom} onChange={(e) => set('publishedFrom', e.target.value)} /></Field>
        </div><div className="profile-checks"><label><Checkbox checked={form.salaryOnly} onChange={(e) => set('salaryOnly', e.target.checked)} /> Только с зарплатой</label><label><Checkbox checked={form.includeUnknownGrade} onChange={(e) => set('includeUnknownGrade', e.target.checked)} /> Включать вакансии с неизвестным grade</label></div></section>
        {mutation.isError && <p className="profile-form-error" role="alert">{getUserFacingErrorMessage(mutation.error)}</p>}
        <div className="profile-actions"><Button type="button" variant="outline" onClick={goBack}>Отмена</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="spin" size={16} />} {mutation.isPending ? 'Сохраняем…' : 'Сохранить профиль'}</Button></div>
      </form>
    </div>
  );
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
  return <div className="profile-field"><Label htmlFor={id}>{label}</Label>{children}{hint && <small>{hint}</small>}{error && <small className="field-error" role="alert">{error}</small>}</div>;
}
function EnumSelect({ id, value, values, empty, onChange }: { id: string; value: string; values: readonly string[]; empty?: string; onChange: (value: string) => void }) {
  const unknown = value && !values.includes(value);
  return <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{empty !== undefined && <option value="">{empty}</option>}{unknown && <option value={value}>{value} (неизвестное значение)</option>}{values.map((item) => <option key={item} value={item}>{labels[item] ?? item}</option>)}</select>;
}
