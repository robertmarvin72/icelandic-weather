export default function Header() {
  return (
    <header className="header-wrap">
      <div className="header-inner">
        {/* Light mode logo */}
        <img
          src="/campcast-light.png"
          alt="CampCast"
          className="header-logo block dark:hidden"
        />

        {/* Dark mode logo */}
        <img
          src="/campcast-dark.png"
          alt="CampCast"
          className="header-logo hidden dark:block"
        />

        <span className="header-title header-title-brand dark:text-slate-100">
          Iceland Camping
        </span>
      </div>
    </header>
  );
}
