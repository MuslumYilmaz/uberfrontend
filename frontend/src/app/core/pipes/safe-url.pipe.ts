import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'appSafeUrl',
  standalone: true,
})
export class SafeUrlPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return value;
  }

}
