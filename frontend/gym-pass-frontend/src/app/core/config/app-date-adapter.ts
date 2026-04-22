import {
  MatDateFormats,
  NativeDateAdapter
} from '@angular/material/core';
import { Injectable } from '@angular/core';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export const APP_DATE_FORMATS: MatDateFormats = {
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

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const normalizedValue = value.trim();
      const match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(normalizedValue);

      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        const parsedDate = new Date(year, month, day);

        if (
          parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month &&
          parsedDate.getDate() === day
        ) {
          return parsedDate;
        }

        return null;
      }
    }

    const parsedDate = super.parse(value);
    return parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  }

  override format(date: Date, _displayFormat: object): string {
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  }
}
