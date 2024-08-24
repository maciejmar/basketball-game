import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { App } from '@capacitor/app';

interface Player {
    name: string;
    shots: number;
    points: number;
}

interface Team {
    name: string;
    players: Player[];
}

@Component({
    selector: 'app-summary',
    standalone: true,
    imports: [CommonModule], 
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
    team1: Team = { name: 'Team 1', players: [] };
    team2: Team = { name: 'Team 2', players: [] };
    team1Points: number = 0;
    team2Points: number = 0;
    summaryMessage: string = '';

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.loadGameSummary();
    }

    loadGameSummary(): void {
        const summaryData = history.state;
        console.log('Router state:', summaryData); // Log to verify the passed state

        if (summaryData && summaryData.team1 && summaryData.team2) {
            this.team1 = summaryData.team1;
            this.team2 = summaryData.team2;
            this.team1Points = summaryData.team1Points;
            this.team2Points = summaryData.team2Points;
            this.summaryMessage = `Game over! ${this.team1.name}-${this.team2.name} - ${this.team1Points} : ${this.team2Points}`;
        } else {
            console.error('No game summary data available or incorrect format', summaryData);
        }
    }

    quitApp() {
      if (window.confirm("Are you sure you want to quit?")) {
        App.exitApp();
      }
    }

    goToMenu(): void {
        this.router.navigate(['/']);
    }
}
