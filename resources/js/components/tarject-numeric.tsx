
export function TarjetNumeric({
  value,
  titulo,
  color // color por defecto
}: {
  value: number;
  titulo: string;
  color: string;
}) {
  return (
    <div
      className={`bg-card p-5 rounded-lg shadow-md border-l-4 border-${color}`}
    >
      <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value || 0}</p>
    </div>
  );
}
