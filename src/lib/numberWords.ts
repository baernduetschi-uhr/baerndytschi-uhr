function deUnit(n: number): string {
  const map: Record<number, string> = {
    0: "null",
    1: "eins",
    2: "zwei",
    3: "drei",
    4: "vier",
    5: "fünf",
    6: "sechs",
    7: "sieben",
    8: "acht",
    9: "neun",
    10: "zehn",
    11: "elf",
    12: "zwölf",
    13: "dreizehn",
    14: "vierzehn",
    15: "fünfzehn",
    16: "sechzehn",
    17: "siebzehn",
    18: "achtzehn",
    19: "neunzehn",
  };

  return map[n] ?? String(n);
}

function deTens(n: number): string {
  const map: Record<number, string> = {
    20: "zwanzig",
    30: "dreißig",
    40: "vierzig",
    50: "fünfzig",
    60: "sechzig",
    70: "siebzig",
    80: "achtzig",
    90: "neunzig",
  };

  return map[n] ?? String(n);
}

export function numberToGermanWords(n: number): string {
  if (n < 20) return deUnit(n);

  if (n < 100) {
    const ones = n % 10;
    const tens = n - ones;

    if (ones === 0) return deTens(tens);

    const onesWord = ones === 1 ? "ein" : deUnit(ones);
    return `${onesWord}und${deTens(tens)}`;
  }

  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredsWord =
      hundreds === 1 ? "einhundert" : `${deUnit(hundreds)}hundert`;

    return rest === 0
      ? hundredsWord
      : `${hundredsWord}${numberToGermanWords(rest)}`;
  }

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandsWord =
      thousands === 1
        ? "eintausend"
        : `${numberToGermanWords(thousands)}tausend`;

    return rest === 0
      ? thousandsWord
      : `${thousandsWord}${numberToGermanWords(rest)}`;
  }

  return String(n);
}

export function dayToGermanOrdinal(day: number): string {
  const irregular: Record<number, string> = {
    1: "erste",
    3: "dritte",
    7: "siebte",
    8: "achte",
  };

  if (irregular[day]) return irregular[day];
  if (day <= 19) return `${numberToGermanWords(day)}te`;
  return `${numberToGermanWords(day)}ste`;
}

function enUnit(n: number): string {
  const map: Record<number, string> = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
  };

  return map[n] ?? String(n);
}

function enTens(n: number): string {
  const map: Record<number, string> = {
    20: "twenty",
    30: "thirty",
    40: "forty",
    50: "fifty",
    60: "sixty",
    70: "seventy",
    80: "eighty",
    90: "ninety",
  };

  return map[n] ?? String(n);
}

export function numberToEnglishWords(n: number): string {
  if (n < 20) return enUnit(n);

  if (n < 100) {
    const ones = n % 10;
    const tens = n - ones;
    return ones === 0 ? enTens(tens) : `${enTens(tens)}-${enUnit(ones)}`;
  }

  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredsWord = `${enUnit(hundreds)} hundred`;

    return rest === 0
      ? hundredsWord
      : `${hundredsWord} ${numberToEnglishWords(rest)}`;
  }

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandsWord = `${numberToEnglishWords(thousands)} thousand`;

    return rest === 0
      ? thousandsWord
      : `${thousandsWord} ${numberToEnglishWords(rest)}`;
  }

  return String(n);
}

export function dayToEnglishOrdinal(day: number): string {
  const irregular: Record<number, string> = {
    1: "first",
    2: "second",
    3: "third",
    5: "fifth",
    8: "eighth",
    9: "ninth",
    12: "twelfth",
  };

  if (irregular[day]) return irregular[day];

  if (day < 20) {
    return `${numberToEnglishWords(day)}th`;
  }

  const ones = day % 10;
  const tens = day - ones;

  if (ones === 0) return `${numberToEnglishWords(day)}th`;

  const ordinalOnes: Record<number, string> = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
  };

  return `${numberToEnglishWords(tens)}-${ordinalOnes[ones]}`;
}