/* eslint-disable @typescript-eslint/no-explicit-any */

class Logger {
  info(message: string, ...args: any[]) {
    console.info(
      ['%c', formatTime(new Date()), '%c ', message].join(''),
      'color: gray',
      'color: inherit;',
      ...args,
    );
  }

  warn(message: string, ...args: any[]) {
    console.warn(
      ['%c', formatTime(new Date()), '%c ', message].join(''),
      'color: orange',
      'color: inherit;',
      ...args,
    );
  }

  beginGroup(groupName: string) {
    console.group(groupName);
  }

  endGroup(message?: string) {
    if (message) {
      this.info(message);
    }
    console.groupEnd();
  }
}

function formatTime(date: Date) {
  return date.toTimeString().substring(0, 8);
}

export const logger = new Logger();
