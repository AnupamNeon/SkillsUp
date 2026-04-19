export default function Empty({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-[var(--bg)] p-8 mb-4">
        <Icon className="h-12 w-12 text-[var(--text-secondary)] opacity-50" />
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{desc}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}