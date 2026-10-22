import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

function setup(enabled = true) {
  const versionUpdates = new Subject<VersionEvent>();
  const activateUpdate = jasmine.createSpy('activateUpdate').and.resolveTo(true);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'a', children: [] },
        { path: 'b', children: [] }
      ]),
      { provide: SwUpdate, useValue: { isEnabled: enabled, versionUpdates, activateUpdate } }
    ]
  });
  const service = TestBed.inject(PwaUpdateService);
  const reload = spyOn(service as unknown as { reload(url: string): void }, 'reload');
  service.start();
  return { versionUpdates, activateUpdate, reload, router: TestBed.inject(Router) };
}

const ready = { type: 'VERSION_READY' } as VersionEvent;
const detected = { type: 'VERSION_DETECTED' } as VersionEvent;

describe('PwaUpdateService', () => {
  it('con una versión nueva lista, activa y recarga en la siguiente navegación (no antes)', async () => {
    const { versionUpdates, activateUpdate, reload, router } = setup();

    versionUpdates.next(ready);
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();

    await router.navigateByUrl('/b');
    await Promise.resolve();
    expect(activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledOnceWith('/b');
  });

  it('ignora los eventos que no son «versión lista»', async () => {
    const { versionUpdates, activateUpdate, reload, router } = setup();
    versionUpdates.next(detected);
    await router.navigateByUrl('/a');
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('sin service worker (desarrollo, tests) no hace nada', async () => {
    const { versionUpdates, reload, router } = setup(false);
    versionUpdates.next(ready);
    await router.navigateByUrl('/a');
    expect(reload).not.toHaveBeenCalled();
  });
});
