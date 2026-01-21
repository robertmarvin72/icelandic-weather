export default function Header(props) {
  const { t } = props;
  return (
    <header className="header-wrap">
      <div className="header-inner">
        {/* Light mode logo */}
        <img src="/campcast-light.png" alt="CampCast" className="header-logo block dark:hidden" />

        {/* Dark mode logo */}
        <img src="/campcast-dark.png" alt="CampCast" className="header-logo hidden dark:block" />

        <span className="header-title header-title-brand dark:text-slate-100">
          {t?.("appTitle") ?? "Iceland Camping Weather"}
        </span>
      </div>
    </header>
  );
}
