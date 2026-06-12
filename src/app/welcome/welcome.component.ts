import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VolumeService } from '../services/volume.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  private menuClickSound: HTMLAudioElement | null = null;

  constructor(private router: Router, private volumeService: VolumeService) {
    this.menuClickSound = new Audio('assets/sci-fi-click-.wav');
    this.menuClickSound.preload = 'auto';
    this.menuClickSound.volume = this.volumeService.getVolume();
  }

  goToMenu() {
    if (this.menuClickSound) {
      const clickSound = this.menuClickSound.cloneNode(true) as HTMLAudioElement;
      clickSound.volume = this.volumeService.getVolume();
      clickSound.play().catch(error => {
        console.error('Error playing welcome click sound:', error);
      });
    }
    this.router.navigate(['/menu']);
  }
}
