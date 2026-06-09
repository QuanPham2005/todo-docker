import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FutureDatePipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const dueDate = value.dueDate ?? value.due_date;
    if (dueDate === undefined || dueDate === null || dueDate === '') {
      return value;
    }

    const parsedDate = this.parseCalendarDate(dueDate);
    if (!parsedDate) {
      throw new BadRequestException('dueDate không hợp lệ');
    }

    const today = new Date();
    const todayKey = this.toDateKey(today);
    const checkDateKey = this.toDateKey(parsedDate);

    if (checkDateKey < todayKey) {
      throw new BadRequestException('dueDate phải là hôm nay hoặc tương lai');
    }

    return {
      ...value,
      dueDate: parsedDate,
    };
  }

  private parseCalendarDate(input: unknown): Date | null {
    if (typeof input !== 'string' || !input.trim()) {
      return null;
    }

    const trimmed = input.trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toDateKey(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
