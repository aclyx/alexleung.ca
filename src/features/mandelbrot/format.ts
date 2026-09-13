import Decimal from "decimal.js";

export function formatPreciseDecimal(
  value: Decimal,
  significantDigits = 24
): string {
  const formatted = value.toSignificantDigits(significantDigits).toString();

  return formatted === "-0" ? "0" : formatted;
}

export function formatMagnification(value: Decimal): string {
  if (value.greaterThanOrEqualTo("1000000")) {
    return `${value.toSignificantDigits(6).toExponential()}x`;
  }

  if (value.greaterThanOrEqualTo(1)) {
    return `${value.toDecimalPlaces(2).toString()}x`;
  }

  return `${value.toSignificantDigits(6).toString()}x`;
}
