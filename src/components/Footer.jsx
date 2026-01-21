export default function Footer(props) {
  const { t } = props;

  const year = new Date().getFullYear();

  return (
    <footer className="footer-wrap">
      <div className="footer-inner">
        <p className="footer-text">
          {t?.("footer") ?? "[t missing]"} © {year} Campcast ·
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Open-Meteo
          </a>
        </p>
      </div>
    </footer>
  );
}
