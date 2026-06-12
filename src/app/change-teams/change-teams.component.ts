import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SQLiteService } from '../services/sqlite.service';
import { Player } from '../models/player';
import { AdmobService } from '../admob.service';

interface Team {
  name: string;
  players: Player[];
}

@Component({
  selector: 'app-change-teams',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './change-teams.component.html',
  styleUrls: ['./change-teams.component.scss'],
})
export class ChangeTeamsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('teamsScroller') teamsScroller?: ElementRef<HTMLElement>;

  team1: Team = { name: 'Team 1', players: Array(5).fill({ name: '' }) };
  team2: Team = { name: 'Team 2', players: Array(5).fill({ name: '' }) };
  public activeSectionIndex = 0;

  constructor(private router: Router, private sqliteService: SQLiteService, private admobService: AdmobService) {}

  ngOnInit() {
    this.loadTeams();
  }

  ngAfterViewInit() {
    this.admobService.showBanner();
    this.updateActiveSection();
  }

  ngOnDestroy() {
    this.admobService.removeBanner();
  }

  async saveTeams() {
    await this.sqliteService.saveTeams(this.team1, this.team2);
    alert('Teams saved successfully!');
    this.router.navigate(['/menu']);
  }

  async loadTeams() {
    const savedTeams = await this.sqliteService.loadTeams();
    if (savedTeams) {
      this.team1 = savedTeams.team1;
      this.team2 = savedTeams.team2;
    }
  }

  onTeamsScroll(): void {
    this.updateActiveSection();
  }

  scrollTeams(direction: 'up' | 'down'): void {
    const scroller = this.teamsScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const nextIndex = direction === 'down' ? 1 : 0;
    const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.teams-screen'));
    const targetSection = sections[nextIndex];
    if (!targetSection) {
      return;
    }

    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSectionIndex = nextIndex;
  }

  get arrowDirection(): 'up' | 'down' {
    return this.activeSectionIndex > 0 ? 'up' : 'down';
  }

  get arrowLabel(): string {
    return this.activeSectionIndex > 0 ? 'Back to team one' : 'Go to team two';
  }

  private updateActiveSection(): void {
    const scroller = this.teamsScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const midpoint = scroller.scrollTop + scroller.clientHeight / 2;
    const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.teams-screen'));
    const currentIndex = sections.findIndex(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      return midpoint >= top && midpoint < bottom;
    });

    if (currentIndex >= 0) {
      this.activeSectionIndex = currentIndex;
    }
  }
}
