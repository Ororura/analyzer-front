interface EmptyResultProps {
  onBack: () => void;
}

export function EmptyResult({ onBack }: EmptyResultProps) {
  return (
    <div className="rounded-lg border bg-secondary/20 p-8 text-center">
      <h3 className="text-lg font-medium">Нет результатов</h3>

      <p className="text-muted-foreground">Загрузите резюме для анализа</p>

      <button type="button" onClick={onBack} className="mt-4 text-primary hover:underline">
        Вернуться к загрузке
      </button>
    </div>
  );
}
