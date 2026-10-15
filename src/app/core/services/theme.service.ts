import { Injectable, signal, computed, effect, OnDestroy } from '@angular/core';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService implements OnDestroy {
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly mode = signal<ThemeMode>(this.getInitialMode());
  readonly isNight = signal<boolean>(this.checkIsNight());

  readonly theme = computed<Theme>(() => {
    const currentMode = this.mode();
    if (currentMode === 'auto') {
      return this.isNight() ? 'dark' : 'light';
    }
    return currentMode;
  });

  constructor() {
    effect(() => {
      const activeTheme = this.theme();
      const activeMode = this.mode();
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem('theme', activeTheme);
      localStorage.setItem('theme_mode', activeMode);
    });

    this.iniciarMonitoreoHorario();
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setMode(newMode: ThemeMode): void {
    this.mode.set(newMode);
  }

  toggleTheme(): void {
    const currentTheme = this.theme();
    this.setMode(currentTheme === 'light' ? 'dark' : 'light');
  }

  checkIsNight(date: Date = new Date()): boolean {
    const hour = date.getHours();
    // Noche de 19:00 a 07:00
    return hour >= 19 || hour < 7;
  }

  private iniciarMonitoreoHorario(): void {
    if (typeof window === 'undefined') return;
    this.timerId = setInterval(() => {
      const night = this.checkIsNight();
      if (this.isNight() !== night) {
        this.isNight.set(night);
      }
    }, 30000);
  }

  private getInitialMode(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'light';

    const savedMode = localStorage.getItem('theme_mode') as ThemeMode | null;
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto') {
      return savedMode;
    }

    const legacySaved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (legacySaved === 'light' || legacySaved === 'dark') {
      return legacySaved;
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }
}
