import { NativeDateAdapter } from '@angular/material/core';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export const ASISTENCIAS_DATE_FORMATS = {
  parse: {
    dateInput: 'dd-MM-yyyy'
  },
  display: {
    dateInput: 'dd-MM-yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd-MM-yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  }
};

export class AsistenciasDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const normalizedValue = value.trim();

      if (!normalizedValue) {
        return null;
      }

      const match = normalizedValue.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

        if (
          parsedDate.getFullYear() === Number(year) &&
          parsedDate.getMonth() === Number(month) - 1 &&
          parsedDate.getDate() === Number(day)
        ) {
          return parsedDate;
        }
      }
    }

    const parsed = super.parse(value, parseFormat);
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat && typeof displayFormat === 'object') {
      return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    }

    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  }
}
