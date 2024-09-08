import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

interface Player {
  name: string;
}

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

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        this.db = await this.sqliteConnection.createConnection('teamsDB', false, 'no-encryption', 1, false);
        await this.db.open();
        await this.db.execute('CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, teamName TEXT, playerNames TEXT)');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async saveTeams(team1: Team, team2: Team): Promise<void> {
    if (!this.db) return;
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
  }

  async loadTeams(): Promise<{ team1: Team; team2: Team } | null> {
    try {
      // Ensure that the database connection is available
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
  }
  }
