import { Component, OnInit, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { App } from '@capacitor/app';
import { Player } from '../models/player';
import { GameStateService } from '../services/game-state.service';
import { VolumeService } from '../services/volume.service';
import { AdMob } from '@capacitor-community/admob';

interface Team {
  name: string;
  players: Player[];
}

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  // team1: Team = { name: 'Team 1', players: [] };
  // team2: Team = { name: 'Team 2', players: [] };
  // team1Points: number = 0;
  // team2Points: number = 0;
  summaryMessage: string = '';
  //public musicVolume = 0; // Default volume
  private backgroundMusic: HTMLAudioElement | null = null;
  public isMusicPlaying = false;

  constructor(
    private router: Router, 
    private gameStateService: GameStateService,
    private volumeService: VolumeService
  ) {}

   // Getter and Setter for team1Name
   get team1Name() { return this.gameStateService.team1.name; }
   set team1Name(value: string) { this.gameStateService.team1.name = value; }
 
   // Getter and Setter for team2Name
   get team2Name() { return this.gameStateService.team2.name; }
   set team2Name(value: string) { this.gameStateService.team2.name = value; }
 
   // Getter and Setter for team1Players
   get team1Players() { return this.gameStateService.team1.players; }
   set team1Players(value: Player[]) { this.gameStateService.team1.players = value; }
 
   // Getter and Setter for team2Players
   get team2Players() { return this.gameStateService.team2.players; }
   set team2Players(value: Player[]) { this.gameStateService.team2.players = value; }
 
   // Getter and Setter for team1Points
   get team1Points() { return this.gameStateService.team1Points; }
   set team1Points(value: number) { this.gameStateService.team1Points = value; }
 
   // Getter and Setter for team2Points
   get team2Points() { return this.gameStateService.team2Points; }
   set team2Points(value: number) { this.gameStateService.team2Points = value; }

  // Getter and Setter for team1
  get team1(): Team { return this.gameStateService.team1; }
  set team1(value: Team) { this.gameStateService.team1 = value; }

  // Getter and Setter for team2
  get team2(): Team { return this.gameStateService.team2; }
  set team2(value: Team) { this.gameStateService.team2 = value; }


  ngOnInit(): void {
    this.loadGameSummary();
    this.initializeBackgroundMusic();
    // Subscribe to volume changes
    this.volumeService.volume$.subscribe(volume => {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = volume;
    }
  });
  }

  // Called on "Return to Menu" button click.
  async goToMenu() {
    // Define the test interstitial ad unit ID provided by Google
    const testInterstitialAdId = 'ca-app-pub-3940256099942544/1033173712';  //  prod id:   ca-app-pub-9509918464023539/1003953263    //here is   test id: 
    try {
      // Prepare the interstitial ad
      await AdMob.prepareInterstitial({
        adId: testInterstitialAdId,
        // Optional: additional configuration can be provided here.
      });
      console.log('Interstitial ad prepared.');

      // Show the interstitial ad
      await AdMob.showInterstitial();
      console.log('Interstitial ad shown.');

      // If the plugin does not resolve only after the ad is dismissed, you can use an event listener:
      // AdMob.addListener('interstitialDismissed', () => {
      //   console.log('Ad dismissed. Navigating to menu.');
      //   this.router.navigate(['/menu']);
      // });

      // For many implementations, the promise resolves upon dismissal.
      // Proceed to navigate after the ad has been shown/dismissed.
      this.router.navigate(['/menu']);

    } catch (error) {
      console.error('!!!!!    Error loading or showing interstitial ad:', error);
      // Fallback: directly navigate to the menu if the ad fails to load or show.

     
      //is.gameStateService.resetGameData();
      //is.router.navigate(['/menu']);
    }
    finally {
      console.log('now reset is been doing');
      // always clear the service state
      this.gameStateService.resetGameData();
      this.router.navigate(['/menu']);
    }
  
  }

  loadGameSummary(): void {
  if (this.gameStateService.team1 && this.gameStateService.team2) {
    this.team1 = this.gameStateService.team1;
    this.team2 = this.gameStateService.team2;
    this.team1Points = this.gameStateService.team1Points;
    this.team2Points = this.gameStateService.team2Points;
    this.summaryMessage = `${this.team1.name} - ${this.team2.name}: ${this.team1Points} : ${this.team2Points}`;
  } else {
    console.error('No game summary data available or incorrect format');
  }
}

  quitApp() {
    if (window.confirm("Are you sure you want to quit?")) {
      App.exitApp();
    }
  }

  // goToMenu(): void {
  //   console.log('now reset is been doing');
  //   this.gameStateService.resetGameData();
  //   this.router.navigate(['/']);
  // }

  private initializeBackgroundMusic(): void {
    this.backgroundMusic = new Audio('assets/drumms.ogg');
    this.backgroundMusic.loop = true; // Set to loop if desired
    // Set initial volume based on the service
    this.backgroundMusic.volume = this.volumeService.getVolume();
    this.volumeService.setVolume(0)
    // Begin playback when user interacts
    document.addEventListener('click', this.startMusicOnUserInteraction);
    document.addEventListener('keydown', this.startMusicOnUserInteraction);
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
  ngOnDestroy(): void {
    this.stopBackgroundMusic();
    
  }

  // updateMusicVolume(): void {
  //   if (this.backgroundMusic) {
  //     this.backgroundMusic.volume = this.musicVolume;
  //   }
  // }
  
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

}
