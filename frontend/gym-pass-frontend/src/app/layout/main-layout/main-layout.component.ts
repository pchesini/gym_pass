import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, ViewChild, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

import { AuthService } from '../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../shared/material/material-imports';
import { navigationItems } from '../../shared/utils/navigation-items';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [...MATERIAL_IMPORTS, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  @ViewChild(MatSidenav) private sidenav?: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly session = this.authService.currentSession;
  protected readonly navigationItems = computed(() =>
    navigationItems.filter((item) => !item.roles || this.authService.hasAnyRole(item.roles))
  );
  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map((state) => state.matches)),
    { initialValue: false }
  );

  protected toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  protected closeSidenavOnMobile(): void {
    if (this.isHandset()) {
      this.sidenav?.close();
    }
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
