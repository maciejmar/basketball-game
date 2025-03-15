import { Component } from '@angular/core';
import { VolumeService } from '../services/volume.service';

@Component({
  selector: 'app-volume-control',
  standalone: true,
  imports: [],
  templateUrl: './volume-control.component.html',
  styleUrl: './volume-control.component.scss'
})
export class VolumeControlComponent {
  volume: number = 1;
  isMuted: boolean = false;
  previousVolume: number = 1;

  constructor(private volumeService: VolumeService) {
    // Get the initial volume from the service
    this.volume = this.volumeService.getVolume();
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.volumeService.setVolume(volume);
  }
  toggleMute() {
    if (this.isMuted) {
      // Unmute
      this.volumeService.setVolume(this.previousVolume || 1);
      this.volume = this.previousVolume || 1;
      this.isMuted = false;
    } else {
      // Mute
      this.previousVolume = this.volume;
      this.volumeService.setVolume(0);
      this.volume = 0;
      this.isMuted = true;
    }
  }
}
