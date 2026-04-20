import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import isdaSureLogo from '../../images/logo.png';

export default function SiteFooter({ className = '' }) {
  const navigate = useNavigate();

  return (
    <footer className={className}>
      <div className="overflow-hidden border-t border-[color:var(--border-default)] bg-[color:rgba(14,22,38,0.82)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_85%_12%,rgba(244,176,56,0.08),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={isdaSureLogo} alt="IsdaSure logo" className="h-14 w-auto object-contain" />
              </div>
              <p className="max-w-md text-sm leading-7 linear-muted">
                On-chain contribution registry on Stellar testnet.
                <br />
                Built for fisherfolk groups, wallet-linked profiles, and transparent community support.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--accent-bright)]">Site</p>
              <div className="space-y-3 text-sm text-[color:var(--foreground-muted)]">
                <button type="button" onClick={() => navigate('/')} className="block transition hover:text-[color:var(--foreground)]">Home</button>
                <button type="button" onClick={() => navigate('/how-it-works')} className="block transition hover:text-[color:var(--foreground)]">How It Works</button>
                <button type="button" onClick={() => navigate('/about-us')} className="block transition hover:text-[color:var(--foreground)]">about</button>
                <button type="button" onClick={() => navigate('/faq')} className="block transition hover:text-[color:var(--foreground)]">FAQ</button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--accent-bright)]">On-chain</p>
              <div className="space-y-3 text-sm text-[color:var(--foreground-muted)]">
                <a
                  href="https://stellar.expert/explorer/testnet/contract/CDNZVMTK3RNWWEQTG4JYC55O5P47YYTC2C2ACJVPI5MDJP63TH3KKKKS"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]"
                >
                  <span>Contract on stellar.expert</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://testnet.stellar.expert"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]"
                >
                  <span>Testnet explorer</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://developers.stellar.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]"
                >
                  <span>Stellar docs</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--accent-bright)]">Source</p>
              <div className="space-y-3 text-sm text-[color:var(--foreground-muted)]">
                <a href="https://github.com/Vallywi/IsdaSure.git" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]">
                  <span>GitHub</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a href="https://github.com/Vallywi/IsdaSure/tree/main/contract" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]">
                  <span>Contract crate</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a href="https://www.risein.com/en/home" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-[color:var(--foreground)]">
                  <span>Rise In</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-[color:var(--border-default)] pt-6 text-[color:var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm">© Stellar PH Bootcamp · 2026</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              <span>Developed by Jecyn Vallirie Turbanos</span>
              <span className="text-[color:var(--accent-bright)]">B U I L T&nbsp;&nbsp; O N&nbsp;&nbsp; S T E L L A R&nbsp;&nbsp; T E S T N E T</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-sm">PH</span>
              <span>Quezon City, PH</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
