import Link from "next/link";

type Card = {
  href: string;
  category: string;
  title: string;
  description: string;
};

const cards: Card[] = [
  {
    href: "/admin/translations",
    category: "Begriffe",
    title: "Wochentäg, Monet, Jahr",
    description: "Übersetzige pro Sprach verwalte",
  },
  {
    href: "/admin/time-words",
    category: "Zytwörter",
    title: "gschlagä, viertu vor, haubi",
    description: "Zeitwörter pro Sprach bearbeite",
  },
  {
    href: "/admin/meal-windows",
    category: "Zytfänschter",
    title: "Zmorgä, Mittag, Aabe",
    description: "Zeitfenster und Bezeichnige",
  },
  {
    href: "/admin/holidays",
    category: "Feiertäg",
    title: "Spezialtäg & Aazeigetext",
    description: "Feiertage und Übersetzige verwalte",
  },
  {
    href: "/admin/settings",
    category: "Einstellige",
    title: "Sprach, Datum, Digital",
    description: "Verhalte vo dr Uhr steuere",
  },
  {
    href: "/admin/languages",
    category: "Sprache",
    title: "Aktivi Sprache verwalte",
    description: "Sprache aktiviere und deaktiviere",
  },
  {
    href: "/admin/date-display",
    category: "Aazige",
    title: "Datum-Reihefolg & Teile",
    description: "Reihefolg und Sichtbarkeit pro Sprach",
  },
  {
    href: "/admin/language-import",
    category: "Import",
    title: "JSON importiere",
    description: "Komplettu Sprach us JSON lade",
  },
  {
    href: "/admin/language-export",
    category: "Export",
    title: "JSON exportiere",
    description: "Sprach als JSON exportiere",
  },
  {
    href: "/admin/language-validation",
    category: "Prüefig",
    title: "Vollständigkeit prüefe",
    description: "Fehlendu Einträg pro Sprach azeige",
  },
  {
    href: "/admin/menu",
    category: "Menü",
    title: "Sprach-Menü konfiguriere",
    description: "Gruppen, Regione und Reihefolg per Drag & Drop",
},
];

export default function AdminHome() {
  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-400 mb-2">
          Admin
        </div>
        <h1 className="text-5xl font-semibold tracking-tight">Verwaltig</h1>
        <p className="text-zinc-400 mt-3">
          Wähl obe e Bereich us zum Bearbeite.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <div className="text-zinc-400 text-sm mb-2">{card.category}</div>
            <div className="text-2xl font-semibold mb-2">{card.title}</div>
            <div className="text-zinc-500 text-sm">{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}