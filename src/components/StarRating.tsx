interface Props { score: number; size?: 'sm' | 'md' | 'lg'; }

export default function StarRating({ score, size = 'md' }: Props) {
  const filledCol = score >= 4 ? '#f59e0b' : score >= 3 ? '#94a3b8' : '#475569';
  const emptyCol  = '#1e293b';
  const fontSize  = size === 'lg' ? '18px' : size === 'sm' ? '12px' : '14px';

  return (
    <span style={{ fontSize, letterSpacing: '1px' }}>
      <span style={{ color: filledCol }}>{'★'.repeat(score)}</span>
      <span style={{ color: emptyCol }}>{'★'.repeat(5 - score)}</span>
    </span>
  );
}
