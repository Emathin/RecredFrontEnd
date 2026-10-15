import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    limpiarEstadoDeTheme();
  });

  afterEach(() => {
    limpiarEstadoDeTheme();
  });

  describe('estado inicial', () => {
    it('dado localStorage con "light", cuando instancio, deberia inicializar en light', () => {
      givenLocalStorageTheme('light');

      const service = whenInstancio();

      thenElThemeEs(service, 'light');
    });

    it('dado localStorage con "dark", cuando instancio, deberia inicializar en dark', () => {
      givenLocalStorageTheme('dark');

      const service = whenInstancio();

      thenElThemeEs(service, 'dark');
    });

    it('dado localStorage vacio y prefers-color-scheme dark, cuando instancio, deberia inicializar en dark', () => {
      givenPrefiereEsquemaOscuro(true);

      const service = whenInstancio();

      thenElThemeEs(service, 'dark');
    });

    it('dado localStorage vacio y prefers-color-scheme light, cuando instancio, deberia inicializar en light', () => {
      givenPrefiereEsquemaOscuro(false);

      const service = whenInstancio();

      thenElThemeEs(service, 'light');
    });
  });

  describe('effect', () => {
    it('dado el service instanciado, cuando corre el effect, deberia setear data-theme y guardar en localStorage', () => {
      givenLocalStorageTheme('dark');

      const service = whenInstancio();
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('theme')).toBe(service.theme());
      expect(localStorage.getItem('theme_mode')).toBe(service.mode());
    });
  });

  describe('toggleTheme y setMode', () => {
    it('dado theme light, cuando hago toggle, deberia pasar a dark', () => {
      givenLocalStorageTheme('light');
      const service = whenInstancio();

      service.toggleTheme();

      thenElThemeEs(service, 'dark');
    });

    it('dado theme dark, cuando hago toggle, deberia pasar a light', () => {
      givenLocalStorageTheme('dark');
      const service = whenInstancio();

      service.toggleTheme();

      thenElThemeEs(service, 'light');
    });

    it('dado modo auto, deberia ser dark de noche y light de dia', () => {
      const service = whenInstancio();
      service.setMode('auto');

      // Prueba noche (21:00)
      const fechaNoche = new Date();
      fechaNoche.setHours(21, 0, 0, 0);
      expect(service.checkIsNight(fechaNoche)).toBeTrue();

      // Prueba dia (14:00)
      const fechaDia = new Date();
      fechaDia.setHours(14, 0, 0, 0);
      expect(service.checkIsNight(fechaDia)).toBeFalse();
    });
  });

  function limpiarEstadoDeTheme(): void {
    localStorage.removeItem('theme');
    localStorage.removeItem('theme_mode');
    document.documentElement.removeAttribute('data-theme');
  }

  function givenLocalStorageTheme(valor: 'light' | 'dark'): void {
    localStorage.setItem('theme', valor);
  }

  function givenPrefiereEsquemaOscuro(matches: boolean): void {
    spyOn(window, 'matchMedia').and.returnValue({ matches } as MediaQueryList);
  }

  function whenInstancio(): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  function thenElThemeEs(service: ThemeService, esperado: 'light' | 'dark'): void {
    expect(service.theme()).toBe(esperado);
  }
});
