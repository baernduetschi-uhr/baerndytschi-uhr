function getBerneseUnit(unit: number): string {
  const units: Record<number, string> = {
    0: "",
    1: "eis",
    2: "zwöi",
    3: "drü",
    4: "vier",
    5: "füf",
    6: "sächs",
    7: "sibe",
    8: "acht",
    9: "nün",
  };

  return units[unit] ?? String(unit);
}

function getBerneseTeen(lastTwo: number): string {
  const teens: Record<number, string> = {
    10: "zäh",
    11: "elf",
    12: "zwöuf",
    13: "drizäh",
    14: "vierzäh",
    15: "füfzäh",
    16: "sächzäh",
    17: "sibezäh",
    18: "achtzäh",
    19: "nünzäh",
  };

  return teens[lastTwo] ?? String(lastTwo);
}

function getBerneseTens(lastTwo: number): string {
  if (lastTwo < 10) {
    return getBerneseUnit(lastTwo);
  }

  if (lastTwo < 20) {
    return getBerneseTeen(lastTwo);
  }

  if (lastTwo === 20) {
    return "zwänzg";
  }

  const unit = lastTwo % 10;

  if (lastTwo === 30) return "drissg";
  if (lastTwo === 40) return "vierzg";
  if (lastTwo === 50) return "füfzg";
  if (lastTwo === 60) return "sächzg";
  if (lastTwo === 70) return "sibezg";
  if (lastTwo === 80) return "achtzg";
  if (lastTwo === 90) return "nünzg";

  if (lastTwo > 20 && lastTwo < 30) {
    return `${getBerneseUnit(unit)}äzwänzg`;
  }

  return String(lastTwo);
}

export function formatBerneseYear(year: number): string {
  if (year >= 2000 && year <= 2099) {
    const lastTwo = year % 100;

    if (lastTwo === 0) {
      return "zwöituusig";
    }

    return `zwänzg ${getBerneseTens(lastTwo)}`;
  }

  return String(year);
}