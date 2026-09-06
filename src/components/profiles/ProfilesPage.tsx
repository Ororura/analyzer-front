import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileForm } from './ProfileForm';
import { deleteAnalysisProfile, getAnalysisProfile } from '@/lib/api/analysis-profiles';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { analysisProfilesQueryKey, useAnalysisProfiles } from '@/hooks/useAnalysisProfiles';
import type { AnalysisProfileDto } from '@/types/analysis-profile';

export function ProfilesPage({ onDirtyChange, initialEditId }: { onDirtyChange: (dirty: boolean) => void; initialEditId?: string }) {
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>(initialEditId ? 'edit' : 'list');
  const [editId, setEditId] = useState<string | undefined>(initialEditId);
  const [deleting, setDeleting] = useState<AnalysisProfileDto>();
  const profiles = useAnalysisProfiles();
  const detail = useQuery({ queryKey: ['analysis-profile', editId], queryFn: ({ signal }) => getAnalysisProfile(editId!, signal), enabled: mode === 'edit' && Boolean(editId) });
  const queryClient = useQueryClient();
  const remove = useMutation({ mutationFn: (profile: AnalysisProfileDto) => deleteAnalysisProfile(profile.id, profile.version), onSuccess: async () => { setDeleting(undefined); await queryClient.invalidateQueries({ queryKey: analysisProfilesQueryKey }); } });
  const done = useCallback(() => { onDirtyChange(false); setMode('list'); setEditId(undefined); }, [onDirtyChange]);
  if (mode === 'new') return <ProfileForm onDone={done} onDirtyChange={onDirtyChange} />;
  if (mode === 'edit') {
    if (detail.isPending) return <p className="glass-card profile-state" role="status">Загружаем актуальные данные профиля…</p>;
    if (detail.isError) return <ProfileState message={getUserFacingErrorMessage(detail.error)} retry={() => detail.refetch()} back={done} />;
    return <ProfileForm profile={detail.data} onDone={done} onDirtyChange={onDirtyChange} />;
  }
  return <div className="profile-page"><header className="profile-list-header"><div><h1>Профили анализа</h1><p>Сохранённые настройки целевого рынка и технологий.</p></div><Button onClick={() => setMode('new')}><Plus size={16} /> Создать профиль</Button></header>
    {profiles.isPending ? <p className="glass-card profile-state" role="status">Загружаем профили…</p> : profiles.isError ? <ProfileState message={getUserFacingErrorMessage(profiles.error)} retry={() => profiles.refetch()} /> : profiles.data.length === 0 ? <div className="glass-card profile-empty"><h2>Профилей пока нет</h2><p>Создайте профиль или продолжайте использовать legacy presets на странице анализа.</p><Button onClick={() => setMode('new')}>Создать первый профиль</Button></div> : <div className="profile-list">{profiles.data.map((profile) => <article className="glass-card profile-card" key={profile.id}><div><h2>{profile.name}</h2><p>{profile.direction} · {profile.specialization} · {profile.targetGrade}</p><div className="profile-chips">{profile.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>{profile.preset && <small>Legacy preset: {profile.preset}</small>}</div><div className="profile-card-actions"><Button variant="outline" size="sm" onClick={() => { setEditId(profile.id); setMode('edit'); }}><Pencil size={15} /> Редактировать</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(profile)} aria-label={`Удалить ${profile.name}`}><Trash2 size={15} /> Удалить</Button></div></article>)}</div>}
    {deleting && <DeleteDialog profile={deleting} pending={remove.isPending} error={remove.error} onCancel={() => setDeleting(undefined)} onDelete={() => remove.mutate(deleting)} />}
  </div>;
}

function DeleteDialog({ profile, pending, error, onCancel, onDelete }: { profile: AnalysisProfileDto; pending: boolean; error: unknown; onCancel: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="delete-title" onCancel={(event) => { if (pending) event.preventDefault(); else onCancel(); }}><h2 id="delete-title">Удалить профиль?</h2><p>Профиль «{profile.name}» будет удалён. Это действие нельзя отменить.</p>{Boolean(error) && <p role="alert" className="field-error">{getUserFacingErrorMessage(error)}</p>}<div><Button variant="outline" autoFocus onClick={onCancel} disabled={pending}>Отмена</Button><Button variant="destructive" onClick={onDelete} disabled={pending}>{pending ? 'Удаляем…' : 'Удалить'}</Button></div></dialog>;
}

function ProfileState({ message, retry, back }: { message: string; retry: () => void; back?: () => void }) {
  return <div className="glass-card profile-state" role="alert"><p>{message}</p><div>{back && <Button variant="outline" onClick={back}>К списку</Button>}<Button onClick={retry}>Повторить</Button></div></div>;
}
