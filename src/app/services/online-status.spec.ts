import { TestBed } from '@angular/core/testing';
import { OnlineStatus } from './online-status';

describe('OnlineStatus', () => {
  it('sigue los eventos online/offline del navegador', () => {
    const status = TestBed.inject(OnlineStatus);
    window.dispatchEvent(new Event('offline'));
    expect(status.online()).toBeFalse();
    window.dispatchEvent(new Event('online'));
    expect(status.online()).toBeTrue();
  });
});
