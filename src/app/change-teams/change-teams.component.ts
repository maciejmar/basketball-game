import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Player {
  name: string;
  shots?: number;
  points?: number;
}

interface Team {
  name: string;
  players: Player[];
}

@Component({
  selector: 'app-change-teams',
  templateUrl: './change-teams.component.html',
  styleUrls: ['./change-teams.component.scss'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class ChangeTeamsComponent {
  team1: Team = { name: 'Team 1', players: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }, { name: '' }] };
  team2: Team = { name: 'Team 2', players: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }, { name: '' }] };


  constructor(private router: Router) {
    this.loadTeams();
  }

  saveTeams() {
    // Ensure empty names are not saved, retaining the default names
    this.team1.players = this.team1.players.map((player, index) => ({
      ...player,
      name: player.name || `Player 1-${index + 1}`
    }));
    this.team2.players = this.team2.players.map((player, index) => ({
      ...player,
      name: player.name || `Player 2-${index + 1}`
    }));
    localStorage.setItem('team1', JSON.stringify(this.team1));
    localStorage.setItem('team2', JSON.stringify(this.team2));
    alert('Teams saved successfully!');
    this.router.navigate(['/']);
  }

  loadTeams() {
    const savedTeam1 = localStorage.getItem('team1');
    const savedTeam2 = localStorage.getItem('team2');
    if (savedTeam1) {
      this.team1 = JSON.parse(savedTeam1);
    }
    if (savedTeam2) {
      this.team2 = JSON.parse(savedTeam2);
    }
  }

  
}
