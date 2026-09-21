const USE_CASES = [
  "Shared Flats",
  "Hostels",
  "PGs",
  "Apartments",
  "Rented Houses",
  "Co-living Spaces",
];

export function LogoStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Trusted by people living together everywhere
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {USE_CASES.map((label) => (
            <span
              key={label}
              className="text-sm font-medium text-muted-foreground/80"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
