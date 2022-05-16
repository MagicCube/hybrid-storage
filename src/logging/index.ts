/* eslint-disable @typescript-eslint/no-explicit-any */

class Logger {
  enabled = false;

  info(message: string, ...args: any[]) {
    if (!this.enabled) {
      return;
    }
    console.info(
      ['%c', formatTime(new Date()), '%c ', message].join(''),
      'color: gray',
      'color: inherit;',
      ...args,
    );
  }

  warn(message: string, ...args: any[]) {
    if (!this.enabled) {
      return;
    }
    console.warn(
      ['%c', formatTime(new Date()), '%c ', message].join(''),
      'color: orange',
      'color: inherit;',
      ...args,
    );
  }

  beginGroup(groupName: string) {
    if (!this.enabled) {
      return;
    }
    console.group(groupName);
  }

  endGroup(message?: string) {
    if (!this.enabled) {
      return;
    }
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
