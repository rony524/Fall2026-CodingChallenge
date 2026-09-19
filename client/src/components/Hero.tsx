/**
 * A simple landing-page hero: headline, subtitle, one or two buttons and an optional image.
 *
 * Not used at the moment: HomePage shows the animated AccordionHero instead. It's kept
 * as a plainer alternative for a signed-out landing page.
 */
import "./Hero.css";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;          // text of the main button
  onCtaClick: () => void;
  secondaryLabel?: string;   // optional second button; omit both secondary props to hide it
  onSecondaryClick?: () => void;
  imageUrl?: string; // optional preview image / screenshot shown beside the copy
}

// A landing-page hero — the first thing a signed-out visitor sees.
// Keep it to one message and one primary action; resist adding more here.
export function Hero({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  secondaryLabel,
  onSecondaryClick,
  imageUrl,
}: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <div className="hero-actions">
          <button type="button" className="hero-cta" onClick={onCtaClick}>
            {ctaLabel}
          </button>

          {secondaryLabel && (
            <button type="button" className="hero-secondary" onClick={onSecondaryClick}>
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>

      {imageUrl && (
        <div className="hero-media">
          {/* alt="" because the image is decorative (the copy beside it says everything) */}
          <img src={imageUrl} alt="" />
        </div>
      )}
    </section>
  );
}
