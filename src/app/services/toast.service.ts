import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
}

interface ShowOptions {
  readonly type?: ToastType;
  readonly duration?: number;
}

const DEFAULT_DURATION = 6000;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;
  private readonly timeouts = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.messages.asReadonly();

  show(message: string, options: ShowOptions = {}): void {
    const duration = Number.isFinite(options.duration) ? Math.max(0, Number(options.duration)) : DEFAULT_DURATION;
    const type = options.type ?? 'info';
    const id = this.nextId++;

    this.messages.update((current) => [...current, { id, message, type }]);

    if (duration > 0) {
      const handle = globalThis.setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timeouts.set(id, handle);
    }
  }

  showError(message: string, duration?: number): void {
    this.show(message, { type: 'error', duration });
  }

  dismiss(id: number): void {
    this.messages.update((current) => current.filter((toast) => toast.id !== id));
    const handle = this.timeouts.get(id);
    if (handle !== undefined) {
      globalThis.clearTimeout(handle);
      this.timeouts.delete(id);
    }
  }

  clear(): void {
    this.messages.update(() => []);
    this.timeouts.forEach((handle) => globalThis.clearTimeout(handle));
    this.timeouts.clear();
  }
}
