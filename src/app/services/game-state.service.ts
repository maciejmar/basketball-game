import { Injectable } from '@angular/core';
import { Player } from '../models/player';

interface Team {
  name: string;
  players: Player[];
}

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  // team1: Team = { name: 'Team 1', players: [] };
  // team2: Team = { name: 'Team 2', players: [] };
  team1Points: number = 0;
  team2Points: number = 0;

  team1: Team = {
    name: 'USA',
    players: [
      { name: 'Abdul-Jabbar', shots: 0, points: 0 },
      { name: 'S. O’Neal', shots: 0, points: 0 },
      { name: 'M. Jordan', shots: 0, points: 0 },
      { name: 'K. Bryant', shots: 0, points: 0 },
      { name: 'S. Pippen', shots: 0, points: 0 }
    ]
  };

  team2: Team = {
    name: 'Brasil',
    players: [
      { name: 'Marcelinho', shots: 0, points: 0 },
      { name: 'Neto', shots: 0, points: 0 },
      { name: 'Barbosa', shots: 0, points: 0 },
      { name: 'Nenê', shots: 0, points: 0 },
      { name: 'Santos', shots: 0, points: 0 }
    ]
  };

  resetGameData(): void {
    this.team1Points = 0;
    this.team2Points = 0;
    this.team1.players.forEach(player => { player.shots = 0; player.points = 0; });
    this.team2.players.forEach(player => { player.shots = 0; player.points = 0; });
  }
}
