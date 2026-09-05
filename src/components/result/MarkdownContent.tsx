import { Children, isValidElement, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, ChevronDown, Copy, FileText } from 'lucide-react';
import { ContentBoundary } from './ContentBoundary';
import './markdown.css';

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : '',
    )
    .join('');
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const code = Children.toArray(children).find(isValidElement);
  const language =
    code && isValidElement<{ className?: string }>(code)
      ? (/language-([^\s]+)/.exec(code.props.className ?? '')?.[1] ?? 'Текст')
      : 'Текст';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children));
      setCopied(true);
      setError(false);
    } catch {
      setCopied(false);
      setError(true);
    }
  };
  return (
    <div className="code-card">
      <div className="code-header">
        <span>{language}</span>
        <button
          type="button"
          onClick={() => {
            void copy();
          }}
          aria-label={`Скопировать код: ${language}`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Код: ${language}`}>
        {children}
      </pre>
      <span className="copy-status" role="status">
        {error ? 'Не удалось скопировать. Выделите код вручную.' : copied ? 'Код скопирован' : ''}
      </span>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="markdown-table-scroll" tabIndex={0} role="region" aria-label="Таблица отчёта">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CollapsibleMarkdown({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [long, setLong] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => {
      const isLong = element.scrollHeight > 740;
      setLong(isLong);
      const boundary = element.getBoundingClientRect().top + 720;
      element.querySelectorAll<HTMLElement>('a, button, input, [tabindex]').forEach((item) => {
        if (!expanded && isLong && item.getBoundingClientRect().bottom > boundary) {
          if (!item.hasAttribute('data-original-tabindex'))
            item.dataset.originalTabindex = item.getAttribute('tabindex') ?? 'none';
          item.tabIndex = -1;
        } else if (item.hasAttribute('data-original-tabindex')) {
          const original = item.dataset.originalTabindex;
          if (original === 'none') item.removeAttribute('tabindex');
          else item.setAttribute('tabindex', original ?? '0');
          delete item.dataset.originalTabindex;
        }
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [content, expanded]);
  return (
    <>
      <div id={id} ref={container} className={`markdown-preview ${!expanded && long ? 'is-collapsed' : ''}`}>
        <MarkdownContent content={content} />
      </div>
      {long && (
        <button
          className="expand-analysis"
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown size={15} className={expanded ? 'rotate-180' : ''} />
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      )}
    </>
  );
}

export function MarkdownAnalysis({ content }: { content: string }) {
  return (
    <section className="glass-card markdown-analysis">
      <h2 className="card-heading">
        <FileText size={17} />
        Анализ резюме
      </h2>
      <ContentBoundary key={content} title="Не удалось отобразить текст анализа">
        <CollapsibleMarkdown content={content} />
      </ContentBoundary>
    </section>
  );
}
