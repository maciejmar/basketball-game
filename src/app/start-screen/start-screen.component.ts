import { Component,OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CommonModule } from '@angular/common'; // Import CommonModule
import { App } from '@capacitor/app';
import { VolumeControlComponent } from '../volume-control/volume-control.component';
import { VolumeService } from '../services/volume.service';

@Component({
  selector: 'app-start-screen',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, VolumeControlComponent] // Add FormsModule here
})
export class StartScreenComponent {
  difficulty: string = 'easy';
  private backgroundMusic: HTMLAudioElement | null = null;
  private menuClickSound: HTMLAudioElement | null = null;
  public isMusicPlaying = false;
  //public musicVolume = 0; // Default volume
  constructor(private router: Router, private volumeService: VolumeService) { }

  ngOnInit(): void {
    this.initializeBackgroundMusic();
    this.initializeMenuClickSound();
    // Subscribe to volume changes
    this.volumeService.volume$.subscribe(volume => {
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = volume;
      }
      if (this.menuClickSound) {
        this.menuClickSound.volume = volume;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopBackgroundMusic();
  }

  

  // updateMusicVolume(): void {
  //   if (this.backgroundMusic) {
  //     this.backgroundMusic.volume = this.musicVolume;
  //   }
  // }

  private initializeBackgroundMusic(): void {
    this.backgroundMusic = new Audio('assets/basketball-shots-menu2.ogg');
  this.backgroundMusic.loop = true; // Set to loop if desired
  // Set initial volume based on the service
  this.backgroundMusic.volume = this.volumeService.getVolume();
  // Begin playback when user interacts
  document.addEventListener('click', this.startMusicOnUserInteraction);
  document.addEventListener('keydown', this.startMusicOnUserInteraction);
  
  }

  private initializeMenuClickSound(): void {
    this.menuClickSound = new Audio('assets/sci-fi-click-.wav');
    this.menuClickSound.preload = 'auto';
    this.menuClickSound.volume = this.volumeService.getVolume();
  }

  private startMusicOnUserInteraction = () => {
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(error => {
        console.error('Error playing background music:', error);
      });
    }
    // Remove the event listeners after starting music
    document.removeEventListener('click', this.startMusicOnUserInteraction);
    document.removeEventListener('keydown', this.startMusicOnUserInteraction);
  }

  private stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  private playMenuClick(): void {
    if (!this.menuClickSound) {
      return;
    }

    const clickSound = this.menuClickSound.cloneNode(true) as HTMLAudioElement;
    clickSound.volume = this.volumeService.getVolume();
    clickSound.play().catch(error => {
      console.error('Error playing menu click sound:', error);
    });
  }
  
  toggleMusic(): void {
    if (this.backgroundMusic) {
      if (this.isMusicPlaying) {
        this.backgroundMusic.pause();
        this.isMusicPlaying = false;
      } else {
        this.backgroundMusic.play().then(() => {
          this.isMusicPlaying = true;
        }).catch(error => {
          console.error('Error playing background music:', error);
        });
      }
    }
  }

  startGame() {
    this.playMenuClick();
    this.stopBackgroundMusic();
    this.router.navigate(['/game']);
  }

  playWithComputer() {
    this.playMenuClick();
    this.stopBackgroundMusic();
    this.router.navigate(['/game'], { state: { playWithComputer: true, difficulty: this.difficulty } });
  }

  changeTeams() {
    this.playMenuClick();
    this.router.navigate(['/changeNames']);
  }

  howToPlay() {
    this.playMenuClick();
    this.router.navigate(['/how-to-play']);
  }

  quitApp() {
    this.playMenuClick();
    if (window.confirm("Are you sure you want to quit?")) {
      App.exitApp();
    }
  }
  
}
