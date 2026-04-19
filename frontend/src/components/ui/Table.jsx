export default function Table({ headers, data, renderRow, empty }) {
  return (
    <div className="card !p-0 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
            {data.length > 0 ? (
              data.map((item, i) => (
                <tr key={item.id || i} className="transition-colors hover:bg-[var(--bg)]">
                  {renderRow(item)}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}