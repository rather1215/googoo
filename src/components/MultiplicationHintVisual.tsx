interface MultiplicationHintVisualProps {
  a: number;
  b: number;
  item: 'apple' | 'star' | 'block';
}

function PixelItemIcon({ item }: { item: 'apple' | 'star' | 'block' }) {
  if (item === 'apple') {
    return (
      <svg width="16" height="16" viewBox="0 0 8 8" className="shrink-0" aria-hidden="true">
        <rect x="3" y="0" width="2" height="1" fill="#15803D" />
        <rect x="4" y="1" width="1" height="1" fill="#78350F" />
        <rect x="1" y="2" width="6" height="4" fill="#EF4444" />
        <rect x="2" y="2" width="1" height="1" fill="#FCA5A5" />
        <rect x="2" y="6" width="4" height="1" fill="#DC2626" />
      </svg>
    );
  }
  if (item === 'star') {
    return (
      <svg width="16" height="16" viewBox="0 0 8 8" className="shrink-0" aria-hidden="true">
        <rect x="3" y="0" width="2" height="2" fill="#F59E0B" />
        <rect x="0" y="2" width="8" height="2" fill="#FBBF24" />
        <rect x="2" y="4" width="4" height="2" fill="#F59E0B" />
        <rect x="1" y="6" width="2" height="2" fill="#D97706" />
        <rect x="5" y="6" width="2" height="2" fill="#D97706" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" className="shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" fill="#2563EB" />
      <rect x="2" y="2" width="4" height="4" fill="#60A5FA" />
      <rect x="2" y="2" width="2" height="1" fill="#DBEAFE" />
    </svg>
  );
}

export function MultiplicationHintVisual({ a, b, item }: MultiplicationHintVisualProps) {
  const itemName = item === 'apple' ? '사과' : item === 'star' ? '별' : '블록';

  return (
    <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50/90 p-3">
      <p className="mb-2 text-xs font-bold text-amber-900">
        그림 힌트: {itemName} {a}개씩 {b}묶음이에요!
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: b }).map((_, groupIdx) => (
          <div
            key={groupIdx}
            className="flex flex-wrap items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-1.5"
            style={{ maxWidth: '108px' }}
          >
            {Array.from({ length: a }).map((__, itemIdx) => (
              <PixelItemIcon key={itemIdx} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
