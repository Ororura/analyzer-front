import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  History,
  LayoutTemplate,
  Menu,
  ScanText,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import type { HistoryEntry } from '@/types';

export type SidebarTab = 'analyze' | 'result' | 'profiles' | 'market' | 'history';
interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  history: HistoryEntry[];
  onHistoryItemClick: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

export function Sidebar({ activeTab, onTabChange, history, onHistoryItemClick, onClearHistory }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigate = (tab: SidebarTab) => {
    onTabChange(tab);
    setOpen(false);
  };
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else if (dialog.current?.open) {
      dialog.current.close();
      trigger.current?.focus();
    }
  }, [open]);
  useEffect(() => {
    const query = matchMedia('(min-width: 1024px)');
    const close = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener('change', close);
    return () => query.removeEventListener('change', close);
  }, []);
  const contents = (
    <>
      <div className="brand">
        <span className="brand-icon">
          <ScanText size={18} />
        </span>
        <span>ResumeAI</span>
      </div>
      <nav aria-label="Основная навигация" className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === 'profiles' ? 'active' : ''}`}
          aria-current={activeTab === 'profiles' ? 'page' : undefined}
          onClick={() => navigate('profiles')}
        >
          <UserRound />
          Профили анализа
        </button>
        <button
          className={`nav-item ${activeTab === 'analyze' || activeTab === 'result' ? 'active' : ''}`}
          aria-current={activeTab === 'analyze' || activeTab === 'result' ? 'page' : undefined}
          onClick={() => navigate('result')}
        >
          <ScanText />
          Анализ резюме
        </button>
        <button
          className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
          aria-current={activeTab === 'market' ? 'page' : undefined}
          onClick={() => navigate('market')}
        >
          <BriefcaseBusiness />
          Вакансии
        </button>
        {[
          [BarChart3, 'Статистика рынка'],
          [LayoutTemplate, 'Шаблоны резюме'],
          [BookOpen, 'Советы и гайды'],
        ].map(([Icon, label]) => {
          const ItemIcon = Icon as typeof BarChart3;
          return (
            <button className="nav-item unavailable" key={String(label)} disabled>
              <ItemIcon />
              <span>{String(label)}</span>
              <small>Скоро</small>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          aria-current={activeTab === 'history' ? 'page' : undefined}
          onClick={() => navigate('history')}
        >
          <History />
          История<span className="nav-count">{history.length}</span>
        </button>
        {history.length > 0 && (
          <div className="recent-history">
            <span>Последний анализ</span>
            <button
              onClick={() => {
                onHistoryItemClick(history[0]);
                setOpen(false);
              }}
            >
              <FileText size={13} />
              <span>{history[0].fileName}</span>
            </button>
            <button className="history-clear" onClick={onClearHistory}>
              Очистить историю
            </button>
          </div>
        )}
        <button className="nav-item unavailable" disabled>
          <Bell />
          Уведомления<small>Скоро</small>
        </button>
        <button className="nav-item unavailable" disabled>
          <Settings />
          Настройки<small>Скоро</small>
        </button>
        <div className="user-card">
          <span className="user-avatar">
            <UserRound size={17} />
          </span>
          <span>
            <strong>Локальный профиль</strong>
            <small>История на этом устройстве</small>
          </span>
          <ChevronRight size={14} />
        </div>
      </div>
    </>
  );
  return (
    <>
      <aside className="desktop-sidebar">{contents}</aside>
      <button
        ref={trigger}
        className="mobile-menu"
        aria-label="Открыть навигацию"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
        <span>ResumeAI</span>
      </button>
      <dialog
        ref={dialog}
        className="sidebar-drawer"
        aria-label="Навигация ResumeAI"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="drawer-content">
          <button className="drawer-close" aria-label="Закрыть навигацию" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
          {contents}
        </div>
      </dialog>
    </>
  );
}
