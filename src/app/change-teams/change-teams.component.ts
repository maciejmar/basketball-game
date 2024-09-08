import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SQLiteService } from '../services/sqlite.service';

interface Player {
  name: string;
}

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
export class ChangeTeamsComponent implements OnInit {
  team1: Team = { name: 'Team 1', players: Array(5).fill({ name: '' }) };
  team2: Team = { name: 'Team 2', players: Array(5).fill({ name: '' }) };

  constructor(private router: Router, private sqliteService: SQLiteService) {}

  ngOnInit() {
    this.loadTeams();
  }

  async saveTeams() {
    await this.sqliteService.saveTeams(this.team1, this.team2);
    alert('Teams saved successfully!');
    this.router.navigate(['/']);
  }

  async loadTeams() {
    const savedTeams = await this.sqliteService.loadTeams();
    if (savedTeams) {
      this.team1 = savedTeams.team1;
      this.team2 = savedTeams.team2;
    }
  }
}
