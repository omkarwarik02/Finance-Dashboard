import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AppStateService } from './core/services/app-state.service';
import { AppRole } from './core/models/transaction.model';
import { filter, map, mergeMap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  state = inject(AppStateService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  pageTitle = signal<string>('Dashboard');

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // If we don't have data.title, fallback to the title from the route title property
      // But actually Angular handles Title automatically if we set it in routes.
      // Let's just track it for the UI.
    });

    // A simpler way:
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const url = this.router.url;
      if (url.includes('transactions')) this.pageTitle.set('Transactions');
      else if (url.includes('insights')) this.pageTitle.set('Insights');
      else this.pageTitle.set('Dashboard');
    });
  }

  setRole(e: Event) {
    const role = (e.target as HTMLSelectElement).value as AppRole;
    this.state.setRole(role);
  }
}
