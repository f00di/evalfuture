export default function ServicesPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.045]" aria-hidden="true">
      <svg className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="services-finance-pattern" width="168" height="168" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#0B1F33" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
              <rect x="20" y="24" width="38" height="50" rx="4" />
              <path d="M28 36h22M28 48h22M30 62h2M40 62h2M50 62h2" />
              <path d="M96 118V74l20-14 20 14v44" />
              <path d="M108 118V96h16v22M104 82h8M122 82h8" />
              <path d="M74 132h56" />
              <path d="M82 48h48M82 68h30" />
              <path d="M90 30l46 46M136 30L90 76" />
              <circle cx="113" cy="53" r="35" />
              <path d="M34 126h20v-28M66 126h20V90M98 126h20v-44" stroke="#0F766E" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#services-finance-pattern)" />
      </svg>
    </div>
  );
}
