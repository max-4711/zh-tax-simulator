export type AppPage = 'basisangaben' | 'basisrechnung';

export class AppNavigation {
  private readonly drawer: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly calculationLink: HTMLButtonElement;
  private readonly lockHint: HTMLElement;
  private readonly notification: HTMLElement;
  private readonly dismissNotification: HTMLButtonElement;
  private readonly pageLinks: HTMLButtonElement[];
  private readonly closeButtons: HTMLButtonElement[];
  private readonly backdrop: HTMLButtonElement;
  private readonly mobileQuery: MediaQueryList;
  private currentPage: AppPage = 'basisangaben';
  private complete = false;
  private notificationDismissed = false;
  private notificationTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly root: HTMLElement) {
    this.drawer = this.getElement('#navigation-drawer');
    this.toggle = this.getElement('#navigation-toggle');
    this.calculationLink = this.getElement('#basisrechnung-navigation');
    this.lockHint = this.getElement('#navigation-lock-hint');
    this.notification = this.getElement('#completion-notification');
    this.dismissNotification = this.getElement('#dismiss-completion');
    this.backdrop = this.getElement('.drawer-backdrop');
    this.pageLinks = Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-page-target]'));
    this.closeButtons = Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-close-navigation]'));
    this.mobileQuery = window.matchMedia('(max-width: 800px)');

    this.toggle.addEventListener('click', () => this.setDrawerOpen(!this.isDrawerOpen()));
    this.backdrop.addEventListener('click', () => this.setDrawerOpen(false));
    this.dismissNotification.addEventListener('click', () => this.hideNotification());

    for (const button of this.closeButtons) {
      button.addEventListener('click', () => this.setDrawerOpen(false));
    }

    for (const link of this.pageLinks) {
      link.addEventListener('click', () => {
        const target = link.dataset.pageTarget;

        if (target === 'basisangaben' || target === 'basisrechnung') {
          this.showPage(target);
        }
      });
    }

    this.root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (!this.notification.hidden) {
          this.hideNotification();
        } else if (this.isDrawerOpen()) {
          this.setDrawerOpen(false);
          this.toggle.focus();
        }
      }
    });

    this.mobileQuery.addEventListener('change', () => this.setDrawerOpen(!this.mobileQuery.matches));
    this.setDrawerOpen(!this.mobileQuery.matches);
  }

  setComplete(complete: boolean): void {
    const newlyComplete = complete && !this.complete;
    this.complete = complete;
    this.calculationLink.disabled = !complete;
    if (complete) {
      this.calculationLink.removeAttribute('aria-describedby');
    } else {
      this.calculationLink.setAttribute('aria-describedby', 'navigation-lock-hint');
    }
    this.lockHint.hidden = complete;

    if (!complete) {
      this.notificationDismissed = false;
      this.hideNotification();

      if (this.currentPage === 'basisrechnung') {
        this.showPage('basisangaben');
      }
    } else if (newlyComplete && !this.notificationDismissed) {
      this.showNotification();
    }
  }

  private showPage(page: AppPage): void {
    if (page === 'basisrechnung' && !this.complete) {
      return;
    }

    this.currentPage = page;

    for (const section of this.root.querySelectorAll<HTMLElement>('[data-page]')) {
      section.hidden = section.dataset.page !== page;
    }

    for (const link of this.pageLinks) {
      if (link.dataset.pageTarget === page) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    this.hideNotification();
    this.setDrawerOpen(false);
    this.root.querySelector<HTMLElement>(`#${page}-page h1`)?.focus();
  }

  private showNotification(): void {
    if (this.notificationTimer !== undefined) {
      clearTimeout(this.notificationTimer);
    }

    this.notification.hidden = false;
    this.notificationTimer = setTimeout(() => this.hideNotification(), 10000);
  }

  private hideNotification(): void {
    this.notificationDismissed = true;
    this.notification.hidden = true;

    if (this.notificationTimer !== undefined) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = undefined;
    }
  }

  private isDrawerOpen(): boolean {
    return this.drawer.dataset.open === 'true';
  }

  private setDrawerOpen(open: boolean): void {
    this.drawer.dataset.open = String(open);
    this.root.dataset.navigationOpen = String(open);
    this.toggle.setAttribute('aria-expanded', String(open));
    this.toggle.setAttribute('aria-label', open ? 'Navigation schliessen' : 'Navigation öffnen');
    this.backdrop.hidden = !open || !this.mobileQuery.matches;
  }

  private getElement<T extends HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);

    if (element === null) {
      throw new Error(`Das Navigationselement ${selector} fehlt.`);
    }

    return element;
  }
}
