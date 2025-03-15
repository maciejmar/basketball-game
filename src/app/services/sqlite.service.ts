import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Player } from '../models/player';


interface Team {
  name: string;
  players: Player[];
}

@Injectable({
  providedIn: 'root',
})
export class SQLiteService {
  private sqliteConnection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    if (this.initialized) return;
    try {
      if (Capacitor.isNativePlatform()) {
        this.db = await this.sqliteConnection.createConnection('teamsDB', false, 'no-encryption', 1, false);
        await this.db.open();
        await this.db.execute('CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, teamName TEXT, playerNames TEXT)');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async saveTeams(team1: Team, team2: Team): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      if (!this.db) {
        console.error('Database not initialized.');
        return;
      }
      try {
        await this.db.execute('DELETE FROM teams');
        await this.db.run(
          `INSERT INTO teams (teamName, playerNames) VALUES (?, ?)`,
          [team1.name, JSON.stringify(team1.players.map((player) => player.name))]
        );
        await this.db.run(
          `INSERT INTO teams (teamName, playerNames) VALUES (?, ?)`,
          [team2.name, JSON.stringify(team2.players.map((player) => player.name))]
        );
      } catch (error) {
        console.error('Failed to save teams:', error);
      }
    } else {
      // Save to localStorage
      localStorage.setItem('team1', JSON.stringify(team1));
      localStorage.setItem('team2', JSON.stringify(team2));
    }
  }

  async loadTeams(): Promise<{ team1: Team; team2: Team } | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        if (!this.db) {
          console.error('Database connection is not available.');
          return null;
        }
        const query = `SELECT teamName, playerNames FROM teams ORDER BY id ASC`;
        const result = await this.db.query(query);
        if (result.values && result.values.length === 2) {
          const team1: Team = {
            name: result.values[0].teamName,
            players: JSON.parse(result.values[0].playerNames).map((name: string) => ({ name })),
          };
          const team2: Team = {
            name: result.values[1].teamName,
            players: JSON.parse(result.values[1].playerNames).map((name: string) => ({ name })),
          };
          return { team1, team2 };
        }
        return null;
      } catch (error) {
        console.error('Failed to load teams:', error);
        return null;
      }
    } else {
      // Load from localStorage
      const savedTeam1 = localStorage.getItem('team1');
      const savedTeam2 = localStorage.getItem('team2');
      if (savedTeam1 && savedTeam2) {
        const team1: Team = JSON.parse(savedTeam1);
        const team2: Team = JSON.parse(savedTeam2);
        return { team1, team2 };
      }
      return null;
    }
  }
}