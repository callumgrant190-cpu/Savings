// S&P 500 calendar-year total returns (dividends reinvested) and US CPI
// inflation, 1928 to 2025.
//
// Source: Robert Shiller's monthly S&P 500 dataset as packaged at
// github.com/datasets/s-and-p-500. Returns compound each month's price change
// plus one twelfth of the trailing annual dividend. Shiller's prices are monthly
// averages, so a single year can differ by a few points from the close-to-close
// figure quoted in the press; long-run averages match closely.
//
// 2023-2025 dividends are estimated from a 1.5% / 1.3% / 1.2% yield and CPI
// from published December-on-December US figures, because the dataset's
// dividend and CPI columns stop mid-2023.

export interface Sp500Year {
  year: number;
  /** Total return, percent. */
  ret: number;
  /** US CPI inflation, percent. */
  cpi: number;
  estimated?: boolean;
}

export const SP500: Sp500Year[] = [
  { year: 1928, ret: 38.13, cpi: -1.16 },
  { year: 1929, ret: -4.21, cpi: 0.58 },
  { year: 1930, ret: -24.01, cpi: -6.4 },
  { year: 1931, ret: -41.78, cpi: -9.32 },
  { year: 1932, ret: -11.05, cpi: -10.27 },
  { year: 1933, ret: 54.42, cpi: 0.76 },
  { year: 1934, ret: -2.8, cpi: 1.52 },
  { year: 1935, ret: 47.02, cpi: 2.99 },
  { year: 1936, ret: 35.75, cpi: 1.45 },
  { year: 1937, ret: -31.93, cpi: 2.86 },
  { year: 1938, ret: 22.48, cpi: -2.78 },
  { year: 1939, ret: 2.01, cpi: 0.0 },
  { year: 1940, ret: -9.66, cpi: 0.71 },
  { year: 1941, ret: -10.74, cpi: 9.93 },
  { year: 1942, ret: 17.16, cpi: 9.03 },
  { year: 1943, ret: 27.0, cpi: 2.96 },
  { year: 1944, ret: 20.02, cpi: 2.3 },
  { year: 1945, ret: 38.14, cpi: 2.25 },
  { year: 1946, ret: -9.09, cpi: 18.13 },
  { year: 1947, ret: 4.48, cpi: 8.84 },
  { year: 1948, ret: 6.87, cpi: 2.99 },
  { year: 1949, ret: 16.47, cpi: -2.07 },
  { year: 1950, ret: 27.87, cpi: 5.93 },
  { year: 1951, ret: 26.8, cpi: 6.0 },
  { year: 1952, ret: 17.92, cpi: 0.75 },
  { year: 1953, ret: 0.99, cpi: 0.75 },
  { year: 1954, ret: 48.06, cpi: -0.74 },
  { year: 1955, ret: 34.95, cpi: 0.37 },
  { year: 1956, ret: 6.31, cpi: 2.99 },
  { year: 1957, ret: -9.66, cpi: 2.9 },
  { year: 1958, ret: 37.78, cpi: 1.76 },
  { year: 1959, ret: 13.92, cpi: 1.73 },
  { year: 1960, ret: -0.43, cpi: 1.36 },
  { year: 1961, ret: 30.1, cpi: 0.67 },
  { year: 1962, ret: -9.72, cpi: 1.33 },
  { year: 1963, ret: 22.19, cpi: 1.64 },
  { year: 1964, ret: 16.58, cpi: 0.97 },
  { year: 1965, ret: 12.54, cpi: 1.92 },
  { year: 1966, ret: -8.33, cpi: 3.46 },
  { year: 1967, ret: 20.94, cpi: 3.04 },
  { year: 1968, ret: 15.2, cpi: 4.72 },
  { year: 1969, ret: -11.67, cpi: 6.2 },
  { year: 1970, ret: 2.69, cpi: 5.57 },
  { year: 1971, ret: 13.65, cpi: 3.27 },
  { year: 1972, ret: 21.88, cpi: 3.41 },
  { year: 1973, ret: -16.86, cpi: 8.71 },
  { year: 1974, ret: -26.1, cpi: 12.34 },
  { year: 1975, ret: 38.04, cpi: 6.94 },
  { year: 1976, ret: 22.52, cpi: 4.86 },
  { year: 1977, ret: -6.31, cpi: 6.7 },
  { year: 1978, ret: 7.82, cpi: 9.02 },
  { year: 1979, ret: 18.16, cpi: 13.29 },
  { year: 1980, ret: 30.23, cpi: 12.52 },
  { year: 1981, ret: -2.5, cpi: 8.92 },
  { year: 1982, ret: 19.2, cpi: 3.83 },
  { year: 1983, ret: 23.17, cpi: 3.79 },
  { year: 1984, ret: 4.72, cpi: 3.95 },
  { year: 1985, ret: 31.36, cpi: 3.8 },
  { year: 1986, ret: 24.12, cpi: 1.1 },
  { year: 1987, ret: -0.11, cpi: 4.43 },
  { year: 1988, ret: 18.8, cpi: 4.42 },
  { year: 1989, ret: 30.21, cpi: 4.65 },
  { year: 1990, ret: -2.35, cpi: 6.11 },
  { year: 1991, ret: 22.07, cpi: 3.06 },
  { year: 1992, ret: 15.51, cpi: 2.9 },
  { year: 1993, ret: 9.96, cpi: 2.75 },
  { year: 1994, ret: 0.46, cpi: 2.67 },
  { year: 1995, ret: 38.42, cpi: 2.54 },
  { year: 1996, ret: 23.56, cpi: 3.32 },
  { year: 1997, ret: 31.77, cpi: 1.7 },
  { year: 1998, ret: 25.49, cpi: 1.61 },
  { year: 1999, ret: 21.56, cpi: 2.68 },
  { year: 2000, ret: -5.75, cpi: 3.39 },
  { year: 2001, ret: -12.82, cpi: 1.55 },
  { year: 2002, ret: -20.19, cpi: 2.38 },
  { year: 2003, ret: 22.26, cpi: 1.88 },
  { year: 2004, ret: 12.82, cpi: 3.26 },
  { year: 2005, ret: 7.09, cpi: 3.42 },
  { year: 2006, ret: 14.27, cpi: 2.54 },
  { year: 2007, ret: 6.31, cpi: 4.08 },
  { year: 2008, ret: -39.23, cpi: 0.09 },
  { year: 2009, ret: 30.03, cpi: 2.72 },
  { year: 2010, ret: 14.02, cpi: 1.5 },
  { year: 2011, ret: 2.1, cpi: 2.96 },
  { year: 2012, ret: 16.8, cpi: 1.74 },
  { year: 2013, ret: 29.71, cpi: 1.5 },
  { year: 2014, ret: 15.86, cpi: 0.76 },
  { year: 2015, ret: 2.04, cpi: 0.73 },
  { year: 2016, ret: 11.73, cpi: 2.07 },
  { year: 2017, ret: 20.91, cpi: 2.11 },
  { year: 2018, ret: -1.82, cpi: 1.91 },
  { year: 2019, ret: 26.15, cpi: 2.28 },
  { year: 2020, ret: 18.5, cpi: 1.36 },
  { year: 2021, ret: 28.26, cpi: 7.04 },
  { year: 2022, ret: -14.99, cpi: 6.46 },
  { year: 2023, ret: 21.66, cpi: 3.4, estimated: true },
  { year: 2024, ret: 29.98, cpi: 2.9, estimated: true },
  { year: 2025, ret: 15.39, cpi: 2.7, estimated: true },
];
