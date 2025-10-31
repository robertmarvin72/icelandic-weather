export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-wrap">
      <div className="footer-inner">
        <p className="footer-text">
          © {year} Iceland Camping Weather · Data by{" "}
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
