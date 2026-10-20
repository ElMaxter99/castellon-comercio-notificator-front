import { disablePageZoom } from './disable-page-zoom';

describe('disablePageZoom', () => {
  function gesture(target: Element): boolean {
    const event = new Event('gesturestart', { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('cancela el zoom de pellizco de la página pero no el de los mapas', () => {
    disablePageZoom(document);

    const page = document.createElement('div');
    const map = document.createElement('div');
    map.className = 'leaflet-container';
    const mapChild = document.createElement('span');
    map.appendChild(mapChild);
    document.body.append(page, map);

    expect(gesture(page)).toBeTrue();
    expect(gesture(map)).toBeFalse();
    expect(gesture(mapChild)).toBeFalse();

    page.remove();
    map.remove();
  });
});
