export function Header({ dateLabel }: { dateLabel: string }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img src="/grain-mark.svg" alt="" className="app-header__mark" />
        <span className="app-header__wordmark">GRAIN</span>
      </div>
      <h1 className="app-header__title">Drink Stock Count</h1>
      <span className="app-header__date">{dateLabel}</span>
    </header>
  );
}
