type PageHeroProps = {
  image: string;
  alt: string;
  mobilePosition?: string;
  desktopPosition?: string;
};

export function PageHero({
  image,
  alt,
  mobilePosition = "center",
  desktopPosition = "center",
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <img
        src={image}
        alt={alt}
        className="page-hero__image"
        style={
          {
            "--mobile-position": mobilePosition,
            "--desktop-position": desktopPosition,
          } as React.CSSProperties
        }
      />
    </section>
  );
}