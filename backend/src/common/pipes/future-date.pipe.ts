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

    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('dueDate không hợp lệ');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      throw new BadRequestException('dueDate phải là hôm nay hoặc tương lai');
    }

    return {
      ...value,
      dueDate: date,
    };
  }
}
