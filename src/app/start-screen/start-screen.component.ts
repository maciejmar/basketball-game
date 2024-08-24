import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CommonModule } from '@angular/common'; // Import CommonModule
import { App } from '@capacitor/app';

@Component({
  selector: 'app-start-screen',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule] // Add FormsModule here
})
export class StartScreenComponent {
  difficulty: string = 'easy';

  constructor(private router: Router) { }

  startGame() {
    this.router.navigate(['/game']);
  }

  playWithComputer() {
    this.router.navigate(['/game'], { state: { playWithComputer: true, difficulty: this.difficulty } });
  }

  changeTeams() {
    this.router.navigate(['/changeNames']);
  }

  quitApp() {
    if (window.confirm("Are you sure you want to quit?")) {
      App.exitApp();
    }
  }
}
