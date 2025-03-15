import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VolumeService {
  private volumeSubject = new BehaviorSubject<number>(1); // Default volume is 1 (max)
  constructor() { }
   // Observable to allow components to subscribe to volume changes
   volume$ = this.volumeSubject.asObservable();

   // Method to set the volume
   setVolume(volume: number) {
     // Ensure volume is between 0 and 1
     const clampedVolume = Math.max(0, Math.min(volume, 1));
     this.volumeSubject.next(clampedVolume);
   }
   // Method to get the current volume
   getVolume(): number {
     return this.volumeSubject.getValue();
   }
}
