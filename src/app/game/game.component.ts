import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SQLiteService } from '../services/sqlite.service';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Player} from './../models/player';
import { GameStateService } from '../services/game-state.service';
import { VolumeService } from '../services/volume.service';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { AdmobService } from '../admob.service';
import { PluginListenerHandle } from '@capacitor/core';
interface Team {
  name: string;
  players: Player[];
}

type PlayerWithTeam = Player & { teamName: string };

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  private summaryMessage: string = '';
  private initialBallXPosition = 60;
  private ctx: CanvasRenderingContext2D | null = null;
  private ball = { x: this.initialBallXPosition, y: 650, radius: 18, velX: 0, velY: 0 };
  private initialBallPosition = { x: this.initialBallXPosition, y: 650 };
  private basket = { x: 1050, y: 320, width: 110, height: 10 };
  private gravity = 0.5;
  private chargePower = 0;
  private charging = false;
  public angle = 45;
  private angleCharging = false;
  private shotCount = 0;
  public currentPlayerIndex = 0;
  public currentTeam = 1;
  private ballScored = false;
  private maxChargePower = 30;
  private angleResetTimeout: any;
  private ballImage: HTMLImageElement | null = null;
  private basketUpImage: HTMLImageElement | null = null;
  private basketDownImage: HTMLImageElement | null = null;
  private targetImage: HTMLImageElement | null = null;
  private mockBasketUpImage: HTMLImageElement | null = null;
  private mockBasketDownImage: HTMLImageElement | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private playerImages: { [key: string]: HTMLImageElement | null } = {
    player_2: null,
    player_3: null,
    player_4: null,
  };
  private playerState: 'player_2' | 'player_3' | 'player_4' = 'player_4';
  private shaking = false;
  private shakeAmplitude = 10;
  private shakeDuration = 600;
  private shakeStartTime: number | null = null;
  private displayScoreText = false;
  private scoreTextTimeout: any;
  public flashScoreTimeout: any;
  public flashing = false;
  private swooshSound: HTMLAudioElement | null = null;
  private bounceSound: HTMLAudioElement | null = null;
  private rimSound: HTMLAudioElement | null = null;
  private scoreSound: HTMLAudioElement | null = null;
  private activeSoundEffects = new Set<HTMLAudioElement>();
  private resetPending = false;
  private userInteracted = false;
  private ballExitedTop = false;
  private pointsScored = 0;
  private lastTimestamp = 0;
  private gameSpeed = 0.001;
  private shotInProgress = false;
  private playWithComputer = false;
  private debounceShot = false;
  difficulty: 'easy' | 'medium' | 'hard' = 'hard';
  private coefficientOfRestitution = 0.6; 
  public showModal = false;
  public modalMessage = '';
  public showQuitModal = false;
  public showMatchEnd = false;
  private xPositionUnchangedStartTime: number | null = null; 
  private infoIconImage: HTMLImageElement | null = null;
  private infoIconBounds: { x: number; y: number; width: number; height: number } | null = null;
  public showTooltips: boolean = false;
  private shotTimer: any = null;
  private shotDuration = 5000; // 5 seconds in milliseconds
  private ballHasBeenInMotion = false;
  private readonly audioInitHandler = () => this.initializeAudio();
  private readonly idleDribbleFloorOffset = 8;
  private readonly idleDribbleSpeed = 0.011;

  public currentPlayerToDisplay = '';
  public currentTeamToDisplay = '';
  public currentShotToDisplay: number | null = null;
  
  // team1Players: Player[] = [ 
  //   { name: 'Player 1-1', shots: 0, points: 0 },
  //   { name: 'Player 1-2', shots: 0, points: 0 },
  //   { name: 'Player 1-3', shots: 0, points: 0 },
  //   { name: 'Player 1-4', shots: 0, points: 0 },
  //   { name: 'Player 1-5', shots: 0, points: 0 },
  // ];
  // team2Players: Player[] = [
  //   { name: 'Player 2-1', shots: 0, points: 0 },
  //   { name: 'Player 2-2', shots: 0, points: 0 },
  //   { name: 'Player 2-3', shots: 0, points: 0 },
  //   { name: 'Player 2-4', shots: 0, points: 0 },
  //   { name: 'Player 2-5', shots: 0, points: 0 },
  // ];
 // Getter and Setter for team1
 get team1(): Team { return this.gameStateService.team1; }
 set team1(value: Team) { this.gameStateService.team1 = value; }

 // Getter and Setter for team2
 get team2(): Team { return this.gameStateService.team2; }
 set team2(value: Team) { this.gameStateService.team2 = value; }

 // Getter and Setter for team1Points
 get team1Points(): number { return this.gameStateService.team1Points; }
 set team1Points(value: number) { this.gameStateService.team1Points = value; }

 // Getter and Setter for team2Points
 get team2Points(): number { return this.gameStateService.team2Points; }
 set team2Points(value: number) { this.gameStateService.team2Points = value; }

 // Getter and Setter for team1Players
 get team1Players(): Player[] { return this.gameStateService.team1.players; }
 set team1Players(value: Player[]) { this.gameStateService.team1.players = value; }

  // Getter and Setter for team2Players
  get team2Players(): Player[] { return this.gameStateService.team2.players; }
  set team2Players(value: Player[]) { this.gameStateService.team2.players = value; }
  // team1Name: string = 'Team 1';
  // team2Name: string = 'Team 2';
  // team1Points = 0;
  // team2Points = 0;
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private sqliteService: SQLiteService,
   private gameStateService: GameStateService, private volumeService: VolumeService, private admobService: AdmobService) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.playWithComputer = navigation.extras.state['playWithComputer'] || false;
      this.difficulty = navigation.extras.state['difficulty'] || 'hard';
    }
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ctx = this.gameCanvas.nativeElement.getContext('2d');
      if (this.ctx) {
        this.resizeCanvas();
        await this.sqliteService.initializeDatabase(); // Initialize DB
        await this.loadTeams(); // Load teams after context is set
        this.initializeImagesAndSounds();
        this.initializeEventListeners();
        this.lastTimestamp = performance.now();
        this.draw(this.lastTimestamp);
      } else {
        console.error('Failed to get canvas context');
      }
    }
    
  }

  ngOnDestroy() {
    if (this.shotTimer) {
      clearTimeout(this.shotTimer);
      this.shotTimer = null;
    }
    this.removeAudioInitializationListeners();
    this.stopAllSounds();
  }

  async loadTeams() {
    try {
      const savedTeams = await this.sqliteService.loadTeams();
      if (savedTeams) {
        this.gameStateService.team1.name = savedTeams.team1.name;
        this.gameStateService.team1.players = savedTeams.team1.players.map((player: { name: string }) => ({
          name: player.name,
          shots: 0,
          points: 0
        }));
        this.gameStateService.team2.name = savedTeams.team2.name;
        this.gameStateService.team2.players = savedTeams.team2.players.map((player: { name: string }) => ({
          name: player.name,
          shots: 0,
          points: 0
        }));
      } else {
        console.error('No saved teams found');
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }
  
  

    // const savedTeam1 = localStorage.getItem('team1');
    // const savedTeam2 = localStorage.getItem('team2');
    // if (savedTeam1) {
    //   const parsedTeam1 = JSON.parse(savedTeam1);
    //   this.team1Name = parsedTeam1.name;
    //   this.team1Players = parsedTeam1.players.map((player: Player) => ({
    //     ...player,
    //     shots: player.shots ?? 0,
    //     points: player.points ?? 0
    //   }));
    // }
    // if (savedTeam2) {
    //   const parsedTeam2 = JSON.parse(savedTeam2);
    //   this.team2Name = parsedTeam2.name;
    //   this.team2Players = parsedTeam2.players.map((player: Player) => ({
    //     ...player,
    //     shots: player.shots ?? 0,
    //     points: player.points ?? 0
    //   }));
    // }
  //}

  initializeImagesAndSounds() {
    this.ballImage = new Image();
    this.ballImage.src = 'assets/ball.png';

    this.basketUpImage = new Image();
    this.basketUpImage.src = 'assets/basket_up.png';

    this.basketDownImage = new Image();
    this.basketDownImage.src = 'assets/basket_down.png';

    this.mockBasketUpImage = new Image();
    this.mockBasketUpImage.src = 'assets/mock-basket-up.png';

    this.mockBasketDownImage = new Image();
    this.mockBasketDownImage.src = 'assets/mock-basket-down.png';

    this.targetImage = new Image();
    this.targetImage.src = 'assets/target.png';

    this.playerImages['player_2'] = new Image();
    this.playerImages['player_2'].src = 'assets/player_2.png';

    this.playerImages['player_3'] = new Image();
    this.playerImages['player_3'].src = 'assets/player_3.png';

    this.playerImages['player_4'] = new Image();
    this.playerImages['player_4'].src = 'assets/player_4.png';

    this.backgroundImage = new Image();
    this.backgroundImage.src = 'assets/background-basketball.png';

    this.infoIconImage = new Image();
    this.infoIconImage.src = 'assets/infoButton.png';

    const images = [
      this.ballImage,
      this.mockBasketUpImage,
      this.mockBasketDownImage,
      this.basketUpImage,
      this.basketDownImage,
      this.targetImage,
      this.playerImages['player_2'],
      this.playerImages['player_3'],
      this.playerImages['player_4'],
      this.infoIconImage,
      this.backgroundImage
    ];

    let imagesLoaded = 0;
    images.forEach(img => {
      img.onload = () => {
        imagesLoaded++;
        console.log(`${img.src} loaded`);
        if (imagesLoaded === images.length) {
          this.lastTimestamp = performance.now();
          this.draw(this.lastTimestamp);
        }
      };
      img.onerror = () => {
        console.error(`${img.src} failed to load`);
      }
    });

    window.addEventListener('pointerdown', this.audioInitHandler, { passive: true });
    window.addEventListener('keydown', this.audioInitHandler);
  }

  initializeEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const canvasElement = this.gameCanvas.nativeElement;
    if (window.innerHeight > window.innerWidth) {
      canvasElement.width = 720;
      canvasElement.height = 1280;
    } else {
      canvasElement.width = 1280;
      canvasElement.height = 720;
    }
    this.draw(this.lastTimestamp);
  }

  initializeAudio() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      this.removeAudioInitializationListeners();
      console.log('audio initializing');
      this.swooshSound = new Audio('assets/swooh.ogg');
      this.bounceSound = new Audio('assets/bounce.ogg');
      this.rimSound = new Audio('assets/rim.ogg');
      this.scoreSound = new Audio('assets/score.ogg');
      [this.swooshSound, this.bounceSound, this.rimSound, this.scoreSound].forEach(sound => {
        sound.preload = 'auto';
        sound.load();
      });

      // Set initial volume based on the service
      const initialVolume = this.volumeService.getVolume();
      this.setAudioVolume(initialVolume);

      // Subscribe to volume changes
      this.volumeService.volume$.subscribe((volume) => {
        this.setAudioVolume(volume);
      });
    }
  }


setAudioVolume(volume: number) {
  if (this.swooshSound) this.swooshSound.volume = volume;
  if (this.bounceSound) this.bounceSound.volume = volume;
  if (this.rimSound) this.rimSound.volume = volume;
  if (this.scoreSound) this.scoreSound.volume = volume;
}
  

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (!this.userInteracted) {
      this.initializeAudio();
    }

    if (event.code === 'Space') {
      if (this.shotInProgress) {
        console.log('Cannot shoot again during the same turn.');
        return;
      }
      this.charging = true;
      this.playerState = 'player_2';
    }
    if (event.code === 'ArrowUp') {
      this.angleCharging = true;
      clearTimeout(this.angleResetTimeout);
    }
    if (event.code === 'KeyQ') {
      this.showQuitModal = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      if (this.shotInProgress) {
        console.log('Cannot shoot again during the same turn.');
        return;
      }  
      this.charging = false;
      this.shoot();
      if (this.swooshSound) {
        this.playSound(this.swooshSound);
        console.log('swoosh sound should be played');
      }
      else console.log('Error! No swoosh sound loaded!');
      this.playerState = 'player_3';
      setTimeout(() => {
        this.playerState = 'player_4';
        if (this.playWithComputer && this.currentTeam === 2) {
          setTimeout(() => this.computerShoots(), 1000); // delay before computer shoots
        }
      }, 1000);
    }
    if (event.code === 'ArrowUp') {
      this.angleCharging = false;
      this.angleResetTimeout = setTimeout(() => {
        this.angle = 45;
      }, 500);
    }
  }

  @HostListener('click', ['$event'])
onCanvasClick(event: MouseEvent) {
  const canvasRect = this.gameCanvas.nativeElement.getBoundingClientRect();
  const scaleX = this.gameCanvas.nativeElement.width / canvasRect.width;
  const scaleY = this.gameCanvas.nativeElement.height / canvasRect.height;
  const clickX = (event.clientX - canvasRect.left) * scaleX;
  const clickY = (event.clientY - canvasRect.top) * scaleY;

  //console.log('Click coordinates:', clickX, clickY);
  //console.log('Info icon bounds:', this.infoIconBounds);
  //Info button service here
  // if (this.infoIconBounds) {
  //   const { x, y, width, height } = this.infoIconBounds;
  //   if (
  //     clickX >= x &&
  //     clickX <= x + width &&
  //     clickY >= y &&
  //     clickY <= y + height
  //   ) {
  //     this.toggleTooltips();
  //   }
  // }
}

  public toggleTooltips() {
    this.showTooltips = !this.showTooltips;
  }
  
  get arrowRotation(): string {
    const rotationAngle = this.angle+180; // Adjust so 45 degrees corresponds to 0 rotation
    return `rotate(${rotationAngle}deg)`;
  }

  get matchWinnerName(): string {
    if (this.team1Points === this.team2Points) {
      return 'Draw Game';
    }

    return this.team1Points > this.team2Points ? this.team1.name : this.team2.name;
  }

  get matchMvp(): PlayerWithTeam | null {
    return this.getRankedPlayers()[0] ?? null;
  }

  get matchTopScorer(): PlayerWithTeam | null {
    return [...this.getAllPlayers()].sort((a, b) => {
      const pointsDelta = (b.points ?? 0) - (a.points ?? 0);
      if (pointsDelta !== 0) {
        return pointsDelta;
      }

      return this.getPlayerAccuracy(b) - this.getPlayerAccuracy(a);
    })[0] ?? null;
  }

  get matchBestAccuracy(): PlayerWithTeam | null {
    return [...this.getAllPlayers()]
      .filter(player => (player.shots ?? 0) > 0)
      .sort((a, b) => this.getPlayerAccuracy(b) - this.getPlayerAccuracy(a))[0] ?? null;
  }
  

  playSound(sound: HTMLAudioElement) {
    if (!this.userInteracted) {
      return;
    }

    const effect = sound.cloneNode(true) as HTMLAudioElement;
    effect.volume = this.volumeService.getVolume();
    effect.preload = 'auto';
    this.activeSoundEffects.add(effect);
    effect.addEventListener('ended', () => {
      this.activeSoundEffects.delete(effect);
    }, { once: true });
    effect.play().catch((error) => {
      this.activeSoundEffects.delete(effect);
      console.error('Error playing sound:', error);
    });
  }
  
  private startShotTimer() {
    if (this.shotTimer) {
      clearTimeout(this.shotTimer);
    }

    this.shotTimer = setTimeout(() => {
      if (this.shotInProgress) {
        console.log('Shot timed out after 5 seconds.');
        this.endShotDueToTimeout();
      }
    }, this.shotDuration);
  }
  private endShotDueToTimeout() {
    // Stop the ball's movement
    this.ball.velX = 0;
    this.ball.velY = 0;

    // Reset flags
    this.shotInProgress = false;
    this.resetPending = false;

    // Proceed to the next turn
    this.nextTurn();

    // Optionally, provide feedback to the player
    this.displayTimeoutMessage();
  }

  private displayTimeoutMessage() {
    this.displayScoreText = true;
    this.pointsScored = this.pointsScored; // No points scored due to timeout

    setTimeout(() => {
      this.displayScoreText = false;
    }, 1500);
  }
  
  shoot() {
    this.pointsScored = 0;
    this.startShotTimer();

    if (this.shotInProgress) {
      console.log('Cannot shoot again during the same turn.');
      return;
    }
    this.ball.velX = this.chargePower * Math.cos(this.angle * Math.PI / 180);
    this.ball.velY = -this.chargePower * Math.sin(this.angle * Math.PI / 180);
    this.ballScored = false;
    this.chargePower = 0;
    this.ballExitedTop = false;
    this.shotInProgress = true; // Mark the shot as beeing in progress
    this.xPositionUnchangedStartTime = null;
  }

  checkBasket() {
    const basketLeft = this.basket.x - this.basket.width / 2;
    const basketRight = this.basket.x + this.basket.width / 2;
    const basketTop = this.basket.y - this.basket.height / 2 - 16;
    const basketBottom = this.basket.y + this.basket.height / 2 - 16;

    const ballInBasket = (
      this.ball.y + this.ball.radius > basketTop &&
      this.ball.y - this.ball.radius < basketBottom &&
      this.ball.x - this.ball.radius > basketLeft + 2 &&
      this.ball.x + this.ball.radius < basketRight -10//- 2
    );

    const ballAboveBasketUp = (
      this.ball.y - this.ball.radius < basketTop
    );

    const ballInMiddleOfBasket = (
      this.ball.y - this.ball.radius < basketBottom &&
      this.ball.y + this.ball.radius > basketTop &&
      this.ball.x > basketLeft &&
      this.ball.x < basketRight
    );

    if (ballInBasket && ballAboveBasketUp && ballInMiddleOfBasket && this.ball.velY > 0) {
      if (!this.ballScored) {
        if (this.ballExitedTop) {
          console.log('ballExitedTop ', this.ballExitedTop);
          this.pointsScored = 3;
          this.addPoints(3);
        } else {
          this.pointsScored = 2;
          this.addPoints(2);
        }
        this.ballScored = true;
        if (this.scoreSound) {
          this.playSound(this.scoreSound);
        }
        this.displayScoreText = true;
        setTimeout(() => {
          this.displayScoreText = false;
        }, 1500);
        this.ball.velX = 0;
        this.ball.velY = 0;
        this.startShaking();
        this.startFlashingScore();
        setTimeout(() => {
          this.ball.velY = this.gravity;
          this.shotInProgress = false; // Reset the shot in progress flag
          console.log('shotCount before nextTurn = ', this.shotCount);
          console.log('Shot ended after scoring');
          if(this.shotCount > 20)this.nextTurn();
          else return;
        }, 3000); // Ensure 3 seconds delay before resetting
      }
    }
    this.ballHasBeenInMotion = false;
  }

  startShaking() {
    this.shaking = true;
    this.shakeStartTime = performance.now();
    setTimeout(() => {
      this.shaking = false;
      this.ball.velY = 0.02;
    }, this.shakeDuration);
  }

  startFlashingScore() {
    this.flashing = true;
    setTimeout(() => {
      this.flashing = false;
    }, 3000);
  }
  checkCollisionWithRim() {
    const basketLeft = this.basket.x - this.basket.width / 2;
    const basketRight = this.basket.x + this.basket.width / 2;
    const rimRadius = 10; // Approximate radius of the rim edges
  
    // Left rim collision
    const dxLeft = this.ball.x - basketLeft;
    const dyLeft = this.ball.y - this.basket.y;
    const distanceLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);
  
    if (distanceLeft < this.ball.radius + rimRadius) {
      // Calculate normal vector
      const nx = dxLeft / distanceLeft;
      const ny = dyLeft / distanceLeft;
  
      // Calculate velocity component along the normal
      const vn = this.ball.velX * nx + this.ball.velY * ny;
  
      // Reflect the velocity along the normal with energy loss
      this.ball.velX -= (1 + this.coefficientOfRestitution) * vn * nx;
      this.ball.velY -= (1 + this.coefficientOfRestitution) * vn * ny;
  
      // Adjust position to prevent sticking
      const overlap = this.ball.radius + rimRadius - distanceLeft;
      this.ball.x += nx * overlap;
      this.ball.y += ny * overlap;
  
      if (this.rimSound) {
        this.playSound(this.rimSound);
      }
    }
  
    // Right rim collision
    const dxRight = this.ball.x - basketRight;
    const dyRight = this.ball.y - this.basket.y;
    const distanceRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);
  
    if (distanceRight < this.ball.radius + rimRadius) {
      // Calculate normal vector
      const nx = dxRight / distanceRight;
      const ny = dyRight / distanceRight;
  
      // Calculate velocity component along the normal
      const vn = this.ball.velX * nx + this.ball.velY * ny;
  
      // Reflect the velocity along the normal with energy loss
      this.ball.velX -= (1 + this.coefficientOfRestitution) * vn * nx;
      this.ball.velY -= (1 + this.coefficientOfRestitution) * vn * ny;
  
      // Adjust position to prevent sticking
      const overlap = this.ball.radius + rimRadius - distanceRight;
      this.ball.x += nx * overlap;
      this.ball.y += ny * overlap;
  
      if (this.rimSound) {
        this.playSound(this.rimSound);
      }
    }
  }
  
  

  checkCollisionWithTarget() {
    if (!this.targetImage) return;
    const targetWidth = this.targetImage.width * 0.3;
    const targetHeight = this.targetImage.height * 0.5;
    const targetX = this.gameCanvas.nativeElement.width - targetWidth - 30;
    const targetY = this.basket.y - 2 * targetHeight / 5 - 100;

    if (
      this.ball.x + this.ball.radius > targetX &&
      this.ball.x - this.ball.radius < targetX + targetWidth &&
      this.ball.y + this.ball.radius > targetY &&
      this.ball.y - this.ball.radius < targetY + targetHeight
    ) {
      this.ball.velX = -this.ball.velX;
      this.ball.x = targetX - this.ball.radius;
      if (this.rimSound) {
        this.playSound(this.rimSound);
      }
    }
  }

  nextTurn() {

     // Clear the shot timer
     if (this.shotTimer) {
      clearTimeout(this.shotTimer);
      this.shotTimer = null;
    }
    if (this.ball.x != this.initialBallPosition.x) {
      this.shotCount += 1;
      console.log('shotCount in nextTurn : ' + this.shotCount)

      if (this.shotCount >= 20) {
        console.log('RESETING');
        console.log('nextTurn players points checking at the end ', this.team1Players);
        console.log('nextTurn players points checking at the end ', this.team2Players);
        const p = this.team2Players[this.currentPlayerIndex]; if (p) p.shots = (p.shots ?? 0) + 1;
        this.showMatchEnd = true;
        return;
      }

      this.resetBallForNextShot();
      this.resetAngle();
      if (this.currentTeam === 1) {
        this.currentTeam = 2;
        if (this.playWithComputer) {
          setTimeout(() => this.computerShoots(), 1000); // Add delay before computer shoots
        }
      } else {
        this.currentTeam = 1;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 5;
      }
    }
      // Log the current state after next turn
      console.log('Current state after next turn:', {
        team1Players: this.team1Players,
        team2Players: this.team2Players,
        team1Points: this.team1Points,
        team2Points: this.team2Points
      });
  }

  addPoints(points: number) {
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex]; 
    console.log('This after points scored : current player:', currentPlayer.name,' currentPlayer.points',currentPlayer.points,' points scored now:',
      points, ' team:', this.currentTeam,
       ' player:',this.team1Players[this.currentPlayerIndex]);
    if(currentPlayer?.points != null) {
         currentPlayer.points += points;
         console.log('Points of currentPlayer.points:', currentPlayer.points);
    }

    else console.error('currentPlayer is undefined');


    if (this.currentTeam === 1) {
      this.team1Points += points;
    } else {
      this.team2Points += points;
    }
      // Log the updated points for the current player
    console.log('in addPoints:');
    console.log(`Updated points for ${currentPlayer.name}: ${currentPlayer.points}`);
    console.log('Current state after adding points:', {
      team1Players: JSON.parse(JSON.stringify(this.team1Players)),
      team2Players: JSON.parse(JSON.stringify(this.team2Players)),
      team1Points: this.team1Points,
      team2Points: this.team2Points
    });
  }

  resetBallForNextShot() {
    console.log('Resetting ball position for next shot');
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex];
    
    console.log('current turns Players in resetBallForNextShot is ', this.team1Players[this.currentPlayerIndex] , '  ', this.team2Players[this.currentPlayerIndex] );
    
    console.log('this.currentPlayerIndex is ', this.currentPlayerIndex);
    console.log('this currentTeam  ', this.currentTeam);
    const team1PlayersCopy = JSON.parse(JSON.stringify(this.team1Players));
    const team2PlayersCopy = JSON.parse(JSON.stringify(this.team2Players));
    console.log('improved current turns Players in resetBallForNextShot is ', team1PlayersCopy[this.currentPlayerIndex], team2PlayersCopy[this.currentPlayerIndex]);
    console.log('----');
    if (this.ball.x != this.initialBallPosition.x) {
      if(currentPlayer?.shots != null) currentPlayer.shots += 1;
      else console.log('no current player - error!');
    }
    this.ball.x = this.initialBallPosition.x;
    this.ball.y = this.initialBallPosition.y;
    this.ball.velX = 0;
    this.ball.velY = 0;
    this.shaking = false;
    this.shakeStartTime = null;
    this.flashing = false;
    this.resetPending = false;
    this.shotInProgress = false; // Reset the shot in progress flag
  }

  resetAngle() {
    console.log('Resetting angle');
    this.angle = 45;
  }

  // async quitGame() {
  //   if (window.confirm("Are you sure you want to quit?")) {
  //   //test interstitial ad unit ID for development
  //   const testAdId = 'ca-app-pub-9509918464023539/7529512361'; //this is prod id  //change on test id:   ca-app-pub-3940256099942544/1033173712
  //   try {
  //     console.log('Preparing interstitial ad for quit action...');
  //     await AdMob.prepareInterstitial({ adId: testAdId });
  //     console.log('Interstitial ad prepared. Now showing ad...');
  //     await AdMob.showInterstitial();
  //     console.log('Interstitial ad was displayed and dismissed.');
  //   } catch (error) {
  //     console.error('Error loading or showing interstitial ad on quit:', error);
  //   }

  //     this.resetGame();
  //   }
  // }

  async quitGame() {
  if (window.confirm("Are you sure you want to quit?")) {
    const adIdToUse = 'ca-app-pub-9509918464023539/8637232401'; // <- Your prod ID, and here tets id:ca-app-pub-9509918464023539/1003953263
    let adLoadedSuccessfully = false; // Flag to track load status
    let loadAttemptComplete = false; // Flag to indicate load process finished (success or failure)
    let loadedListener: PluginListenerHandle | undefined;
    let failedToLoadListener: PluginListenerHandle | undefined;

    try {

      loadedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Loaded,
        () => {
          console.log('Interstitial ad finished loading.');
          adLoadedSuccessfully = true;
          loadAttemptComplete = true;
        }
      );

      failedToLoadListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        (error) => {
          console.error('Interstitial ad failed to load:', error);
          adLoadedSuccessfully = false;
          loadAttemptComplete = true;
        }
      );

      try {
        console.log('Preparing interstitial ad...');
        // prepareInterstitial starts the loading process. It does NOT wait for the ad to load.
        await AdMob.prepareInterstitial({ adId: adIdToUse });

        // --- Wait for the adLoadedSuccessfully flag or a timeout ---
        // We'll wait here until either the loaded or failed event sets loadAttemptComplete to true
        const maxWaitTime = 5000; // 5 seconds timeout for loading
        const startTime = Date.now();

        console.log('Waiting for interstitial ad to load...');
        while (!loadAttemptComplete && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Wait a little before checking flags again
        }

        // Check if the ad actually loaded within the time limit
        if (adLoadedSuccessfully) {
          console.log('Interstitial ad is ready. Now showing ad...');
          await AdMob.showInterstitial();
          console.log('Interstitial ad was displayed and dismissed.');
          // Optional: Listen for InterstitialAdPluginEvents.Dismissed here if needed
        } else {
          console.log('Interstitial ad not loaded or timed out, skipping show.');
        }

      } catch (error) {
        // This catch is for errors during the prepare or show calls themselves,
        // not the ad loading failure which is handled by the FailedToLoad listener.
        console.error('Error during interstitial ad prepare/show process:', error);
      } finally {
        // --- Clean up listeners ---
        console.log('Removing ad listeners.');
        if (loadedListener) await loadedListener.remove();
        if (failedToLoadListener) await failedToLoadListener.remove();
      }

    } catch (error) {
      console.error('Error during interstitial ad prepare/show process:', error);
    } finally {
      // Always reset the game state regardless of ad success/failure
      this.resetGame();
    }
  }
}


    // Access properties directly
    get team1Name() { return this.gameStateService.team1.name; }
    get team2Name() { return this.gameStateService.team2.name; }

  async endGame() {
    this.gameStateService.team1 = {
      name: this.team1Name,
      players: JSON.parse(JSON.stringify(this.team1Players)),
    };
    this.gameStateService.team2 = {
      name: this.team2Name,
      players: JSON.parse(JSON.stringify(this.team2Players)),
    };
    this.gameStateService.team1Points = this.team1Points;
    this.gameStateService.team2Points = this.team2Points;
    this.resetNotFull();
    await this.admobService.showInterstitial();
    this.router.navigate(['/summary']);
  }

  resetNotFull(){
    this.stopAllSounds();
    this.shotCount = 0;
    this.currentPlayerIndex = 0;
  
  }
  
  resetGame() {
    console.log('Resetting game data');
    //this.gameStateService.resetGameData();
    
    // ... reset other game-specific variables if needed ...
  //}
  // resetGame() {
    console.log('Reseting game method');
    this.stopAllSounds();
    this.team1Points = 0;
    this.team2Points = 0;
    this.shotCount = 0;
    this.currentPlayerIndex = 0;
    this.currentTeam = 1;
    this.team1Players.forEach(player => { player.shots = 0; player.points = 0; });
    this.team2Players.forEach(player => { player.shots = 0; player.points = 0; });
    this.resetBallForNextShot();
    this.resetAngle();
  }

  public parseToInt(num:number): number{
    return Math.round(num);
   }

   get arrowColor(): string {
    // Interpolate between blue and cyan based on charge power
    const blue = { r: 0, g: 0, b: 255 }; // Blue color RGB
    const cyan = { r: 0, g: 255, b: 255 }; // Cyan color RGB

    const ratio = this.angle / 90;
    const r = Math.round(blue.r + (cyan.r - blue.r) * ratio);
    const g = Math.round(blue.g + (cyan.g - blue.g) * ratio);
    const b = Math.round(blue.b + (cyan.b - blue.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  draw(timestamp: number) {
    const velXThreshold = 0.01; // Adjusted threshold
    if (!this.ctx || !this.ballImage || !this.basketUpImage || !this.basketDownImage || !this.targetImage || !this.playerImages[this.playerState]
      || !this.mockBasketUpImage || !this.mockBasketDownImage || !this.backgroundImage) return;
  
    const elapsed = (timestamp - this.lastTimestamp) * this.gameSpeed;
    this.lastTimestamp = timestamp;
  
    requestAnimationFrame(this.draw.bind(this));
  
    const canvasWidth = this.gameCanvas.nativeElement.width;
    const canvasHeight = this.gameCanvas.nativeElement.height;
  
    if (this.charging) {
      this.chargePower += 0.5 * elapsed * 60;
      if (this.chargePower > this.maxChargePower) {
        this.chargePower = this.maxChargePower; // Cap at maxChargePower
      }
    }
  
    if (this.angleCharging) {
      this.angle += 1 * elapsed * 60;
      if (this.angle > 90) {
        this.angle = 90;
      }
    }
  
    const idleDribblePosition = this.getIdleDribblePosition(canvasHeight, timestamp);

    if (this.charging && this.ball.x === this.initialBallPosition.x) {
      const chargingBallPosition = this.getChargingBallPosition(canvasHeight);
      this.ball.x = chargingBallPosition.x;
      this.ball.y = chargingBallPosition.y;
    } else if (!this.shotInProgress) {
      this.ball.x = idleDribblePosition.x;
      this.ball.y = idleDribblePosition.y;
    } else {
      this.ball.x += this.ball.velX * elapsed * 60;
      this.ball.y += this.ball.velY * elapsed * 60;
      this.ball.velY += this.gravity * elapsed * 60;
    }
  
    // Check if the ball's horizontal velocity is near zero
    if (this.shotInProgress) {
      const currentTime = performance.now();
      // Start checking only after the ball has been in motion for a short time
      if (this.ballHasBeenInMotion) {
        if (Math.abs(this.ball.velX) < velXThreshold) {
          if (!this.xPositionUnchangedStartTime) {
            this.xPositionUnchangedStartTime = currentTime;
          } else if (currentTime - this.xPositionUnchangedStartTime >= 3000) {
            console.log('Ball has not moved horizontally for 3 seconds, ending shot');
            this.shotInProgress = false;
            this.nextTurn();
            return; // Exit the draw function to prevent further processing
          }
        } else {
          // Ball's horizontal velocity has changed
          this.xPositionUnchangedStartTime = null;
        }
      } else if (Math.abs(this.ball.velX) > velXThreshold) {
        // Ball has started moving
        this.ballHasBeenInMotion = true;
      }
    }

    if (this.ball.y + this.ball.radius < 0) {
      this.ballExitedTop = true;
    }

    if (this.ball.y + this.ball.radius > canvasHeight) {
      this.ball.y = canvasHeight - this.ball.radius;
      this.ball.velY = -this.ball.velY * 0.7;
      if (this.shotInProgress && this.bounceSound) {
        this.playSound(this.bounceSound);
      }
      if (this.ballScored && !this.resetPending) {
        this.resetPending = true;
        console.log('reset Pending - here before nextTurn');
        console.log('ball position x=',this.ball.x, '  y=',this.ball.y);
        setTimeout(() => this.nextTurn(), 15);
      }
    }

    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.velX = -this.ball.velX;
      if (this.shotInProgress && this.bounceSound) {
        this.playSound(this.bounceSound);
      }
    }
    if (this.ball.x - this.ball.radius > canvasWidth) {
      console.log('Ball exited right side of canvas');
      this.nextTurn();
    }

    this.checkBasket();
    this.checkCollisionWithRim();

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the background image
    this.ctx.globalAlpha = 0.3;
    this.ctx.drawImage(this.backgroundImage, 0, 0, canvasWidth, canvasHeight);

    const basketUpWidth = this.basketUpImage.width * 0.4;
    const basketUpHeight = this.basketUpImage.height * 0.4;
    const basketDownWidth = this.basketDownImage.width * 0.4;
    const basketDownHeight = this.basketDownImage.height * 0.4;

    this.ctx.globalAlpha = 0;
    const targetWidth = this.targetImage.width * 0.3;
    const targetHeight = this.targetImage.height * 0.3;
    const targetX = canvasWidth - targetWidth;
    const targetY = this.basket.y - targetHeight / 2 - 100;
    this.ctx.drawImage(this.targetImage, targetX, targetY + 50, targetWidth, targetHeight);

    this.ctx.globalAlpha = 0;
    const shiftBetweenBasketUPandBasketDown = -70;
    this.ctx.drawImage(this.basketUpImage, this.basket.x - basketUpWidth / 2, this.basket.y - basketUpHeight + shiftBetweenBasketUPandBasketDown, basketUpWidth, basketUpHeight);

    //mockingImages draw
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.mockBasketUpImage, this.basket.x - basketUpWidth / 2, this.basket.y - basketUpHeight + shiftBetweenBasketUPandBasketDown, basketUpWidth * 1.7, basketUpHeight * 3.4);

    const playerImage = this.playerImages[this.playerState];
    const renderIdleBallBehindPlayer = !this.shotInProgress && !this.shaking;

    if (renderIdleBallBehindPlayer) {
      this.drawBall();
    }

    if (playerImage) {
      const playerWidth = playerImage.width * 0.7;
      const playerHeight = playerImage.height * 0.7;
      const idlePose = this.getIdlePlayerPose(canvasHeight, timestamp, playerWidth, playerHeight);
      this.ctx.drawImage(playerImage, idlePose.x, idlePose.y, idlePose.width, idlePose.height);
    }

    if (!renderIdleBallBehindPlayer) {
      this.drawBall();
    }
    this.ctx.globalAlpha = 0;
    this.ctx.drawImage(this.basketDownImage, this.basket.x - basketDownWidth / 2, this.basket.y, basketDownWidth, basketDownHeight);

    // Draw the foreground basket image (basket_down) positioned to match basket_up
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.mockBasketDownImage, this.basket.x - 1 - basketUpWidth / 2, this.basket.y + 9, basketDownWidth * 1.7, basketUpHeight * 2.8);
    this.ctx.globalAlpha = 1;

    this.ctx.globalAlpha = 0;
    //this.ctx.fillStyle = "blue";
    this.ctx.rect(1000, 320, 110, 10);
    this.ctx.fill();
    //drawing charge power indicator
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1200, 50, 20, canvasHeight - 100);

    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(1200, canvasHeight - this.chargePower * 20 - 50, 20, this.chargePower * 20);
    this.ctx.save();
    const canvas5procent = canvasWidth*0.02;
    this.ctx.font = `bold ${canvas5procent}px Acme`;
    
    //this.ctx.fillStyle = 'blue';
    //this.ctx.textAlign = 'center';
    //this.ctx.fillText(`Angle: ${Math.round(this.angle)}°`, canvasWidth - 300, 90);
    // Drawing the angle arrow at the right top edge of the canvas
    // this.ctx.save();
    // this.ctx.translate(canvasWidth - 300, 60);
    // this.ctx.rotate(-this.angle * Math.PI / 180);
    // this.ctx.fillStyle = 'black';
    // this.ctx.fillRect(0, -5, 50, 5);
    // this.ctx.beginPath();
    // this.ctx.moveTo(47, -10);
    // this.ctx.lineTo(57, -2);
    // this.ctx.lineTo(47, 5);
    // this.ctx.closePath();
    // this.ctx.fill();
    this.ctx.restore();

    
    
    //Draw the Info icon
    if (this.infoIconImage) {
      const infoIconWidth = 30; // Adjust as needed
      const infoIconHeight = 30; // Adjust as needed
      const infoIconX = canvasWidth - 450; // Position to the left of the angle arrow
      const infoIconY = 10; // Position at the top of the screen
    
      //this.ctx.drawImage(this.infoIconImage, infoIconX, infoIconY, infoIconWidth, infoIconHeight);
    
      // Store the info icon's position and size for click detection
      this.infoIconBounds = { x: infoIconX, y: infoIconY, width: infoIconWidth, height: infoIconHeight };
    }

    
    //Draw the tooltip's condition
    if (this.showTooltips) {
      this.drawTooltips();
    }

    if (this.displayScoreText) {
      this.ctx.fillStyle = 'red';
      const canvas5procent = canvasWidth*0.03;
      this.ctx.font = `bold ${canvas5procent}px Acme`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`SCORE ${this.pointsScored} POINTS!`, canvasWidth / 2, canvasHeight / 2);
    }

    // Display current team, player, and round
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex];
    this.ctx.fillStyle = 'black';
    this.ctx.font = `bold ${canvas5procent}px Acme`;
    const shotInfoX = 370;
    const shotInfoY = 80;

    // Ensure currentPlayer is defined before accessing its properties
    if (currentPlayer) {
      if(this.currentTeam === 1) {this.currentTeamToDisplay = this.gameStateService.team1.name} 
      else {
         if(this.currentTeam == 2) {this.currentTeamToDisplay = this.gameStateService.team2.name}
         else {console.log('error - no current name');this.currentTeamToDisplay='no name'}
      }
      
      this.currentPlayerToDisplay = currentPlayer.name;
      this.currentShotToDisplay = currentPlayer.shots!;
      //this.ctx.fillText(`Team: ${this.currentTeam}`, shotInfoX, shotInfoY - 60);
      //this.ctx.fillText(`Player: ${currentPlayer.name || 'Unknown'}`, shotInfoX, shotInfoY - 40);
      //this.ctx.fillText(`Shots: ${currentPlayer.shots}`, shotInfoX, shotInfoY - 20);
    }
    
    this.checkCollisionWithTarget();
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    if(this.ctx){
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
    }
  }
  
  

  // Add helper method to draw individual tooltips
  private drawTooltip(x: number, y: number, text: string) {
    const padding = 10;
    const radius = 10; // Radius for rounded corners
    if(this.ctx){
      const metrics = this.ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = 16; // Approximate text height
      
      const rectX = x - padding;
      const rectY = y - textHeight - padding;
      const rectWidth = textWidth + 2 * padding;
      const rectHeight = textHeight + 2 * padding;
      // Draw background rectangle
      //this.ctx.fillStyle = 'rgba(247, 158, 24, 1)';
      //this.ctx.fillRect(x - padding, y - textHeight - padding, textWidth + 2 * padding, textHeight + 2 * padding);

      // Draw text
      //this.ctx.fillStyle = 'white';
      //this.ctx.fillText(text, x, y);
      // Draw background rectangle with rounded corners
      this.ctx.fillStyle = 'orange'; // Set background color to orange
      this.drawRoundedRect(rectX, rectY, rectWidth, rectHeight, radius);
      this.ctx.fill();
      // Draw text
      this.ctx.fillStyle = 'white';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(text, x, rectY + padding);
    
  }
  
}

  startCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
     // Prevent starting a new shot if one is already in progress
    if (this.shotInProgress) {
      console.log('Cannot shoot again during the same turn.');
      return;
    }
    if (this.debounceShot) return; // Prevent multiple rapid presses
    this.debounceShot = true;
    setTimeout(() => this.debounceShot = false, 500); // Adjust the delay as needed
    this.charging = true;
    this.playerState = 'player_2';
  }
  
  // Ensure to reset debounce flag on shot end or reset
  stopCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    if (this.shotInProgress) {
      console.log('Cannot shoot again during the same turn.');
      return;
    }  
    this.charging = false;
    this.shoot();
    if (this.swooshSound) {
      this.playSound(this.swooshSound);
    }
    this.playerState = 'player_3';
    setTimeout(() => {
      this.playerState = 'player_4';
      if (this.playWithComputer && this.currentTeam === 2) {
        setTimeout(() => this.computerShoots(), 1000); // Add delay before computer shoots
      }
    }, 1000);
  }

  startAngleCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    this.angleCharging = true;
    clearTimeout(this.angleResetTimeout);
  }

  stopAngleCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    this.angleCharging = false;
    this.angleResetTimeout = setTimeout(() => {
      this.angle = 45;
    }, 500);
  }

  scrollToScores(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    const scoreTable = document.querySelector('.score-table');
    if (scoreTable) {
      scoreTable.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToGame(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private stopAllSounds() {
    if (this.swooshSound) {
      this.swooshSound.pause();
      this.swooshSound.currentTime = 0;
    }
    if (this.bounceSound) {
      this.bounceSound.pause();
      this.bounceSound.currentTime = 0;
    }
    if (this.rimSound) {
      this.rimSound.pause();
      this.rimSound.currentTime = 0;
    }
    if (this.scoreSound) {
      this.scoreSound.pause();
      this.scoreSound.currentTime = 0;
    }
    this.activeSoundEffects.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.activeSoundEffects.clear();
  }

  private drawBall() {
    if (!this.ctx || !this.ballImage) {
      return;
    }

    if (this.shaking && this.shakeStartTime !== null) {
      const elapsedTime = performance.now() - this.shakeStartTime;
      if (elapsedTime < this.shakeDuration) {
        const shakeOffset = Math.sin(elapsedTime / 50) * this.shakeAmplitude;
        this.ctx.drawImage(
          this.ballImage,
          this.ball.x - this.ball.radius + shakeOffset,
          this.ball.y - this.ball.radius,
          this.ball.radius * 2.4,
          this.ball.radius * 2.4
        );
        return;
      }
    }

    this.ctx.drawImage(
      this.ballImage,
      this.ball.x - this.ball.radius,
      this.ball.y - this.ball.radius,
      this.ball.radius * 2.4,
      this.ball.radius * 2.4
    );
  }

  private getIdleDribblePosition(canvasHeight: number, timestamp: number) {
    const playerImage = this.playerImages[this.playerState] ?? this.playerImages['player_4'];
    const playerWidth = (playerImage?.width ?? 180) * 0.7;
    const playerHeight = (playerImage?.height ?? 360) * 0.7;
    const idlePose = this.getIdlePlayerPose(canvasHeight, timestamp, playerWidth, playerHeight);
    const playerX = idlePose.x;
    const playerY = idlePose.y;
    const poseHeight = idlePose.height;
    const poseWidth = idlePose.width;

    const ballX = playerX + poseWidth * 0.72;
    const handY = playerY + poseHeight * 0.43;
    const topY = handY + this.ball.radius * 1.45;
    const bottomY = canvasHeight - this.ball.radius - this.idleDribbleFloorOffset;
    const travel = Math.max(12, bottomY - topY);
    const bounceProgress = (Math.sin(timestamp * this.idleDribbleSpeed) + 1) / 2;
    const easedProgress = 1 - Math.pow(1 - bounceProgress, 2);
    const ballY = topY + travel * easedProgress;

    this.initialBallPosition.x = ballX;

    return {
      x: ballX,
      y: ballY,
      topY,
    };
  }

  private getChargingBallPosition(canvasHeight: number) {
    const playerImage = this.playerImages[this.playerState] ?? this.playerImages['player_4'];
    const playerHeight = (playerImage?.height ?? 360) * 0.7;

    return {
      x: this.initialBallXPosition,
      y: canvasHeight - playerHeight - this.ball.radius - 10 + 45,
    };
  }

  private getIdlePlayerPose(canvasHeight: number, timestamp: number, baseWidth: number, baseHeight: number) {
    const playerX = 20;
    const groundY = canvasHeight - 10;

    if (this.shotInProgress) {
      return {
        x: playerX,
        y: groundY - baseHeight,
        width: baseWidth,
        height: baseHeight,
      };
    }

    const bounceProgress = (Math.sin(timestamp * this.idleDribbleSpeed) + 1) / 2;
    const easedProgress = 1 - Math.pow(1 - bounceProgress, 2);
    const heightScale = 1 - easedProgress * 0.035;
    const widthScale = 1 + easedProgress * 0.018;
    const scaledWidth = baseWidth * widthScale;
    const scaledHeight = baseHeight * heightScale;

    return {
      x: playerX - (scaledWidth - baseWidth) / 2,
      y: groundY - scaledHeight,
      width: scaledWidth,
      height: scaledHeight,
    };
  }

  private removeAudioInitializationListeners() {
    window.removeEventListener('pointerdown', this.audioInitHandler);
    window.removeEventListener('keydown', this.audioInitHandler);
  }

  private computerShoots() {
    const difficultyParams = {
      easy: { minPower: 0.2, maxPower: 1.0, minAngle: 45, maxAngle: 85 },
      medium: { minPower: 0.5, maxPower: 0.9, minAngle: 55, maxAngle: 85 },
      hard: { minPower: 0.95, maxPower: 1.0, minAngle: 60, maxAngle: 80 }
    };

    const params = difficultyParams[this.difficulty];
    const randomPower = Math.random() * (params.maxPower - params.minPower) + params.minPower;
    const randomAngle = Math.random() * (params.maxAngle - params.minAngle) + params.minAngle;

    this.chargePower = randomPower * this.maxChargePower;
    this.angle = randomAngle;

    setTimeout(() => {
      this.shoot();
      if (this.swooshSound) {
        this.playSound(this.swooshSound);
      }
      this.playerState = 'player_3';
      setTimeout(() => {
        this.playerState = 'player_4';
        if (this.currentTeam === 1) {
          setTimeout(() => this.nextTurn(), 1000); // Add delay before switching to next turn
        }
      }, 1000);
    }, 1000); // Add delay to simulate computer's shot preparation
  }

  private drawTooltips() {
    const canvasWidth = this.gameCanvas.nativeElement.width;
    const canvasHeight = this.gameCanvas.nativeElement.height;

    if (this.ctx){
        this.ctx.save();
        const canvas5procent = canvasWidth*0.02;
        this.ctx.font = `bold ${canvas5procent}px Acme`;
        this.ctx.fillStyle = "red";
        //this.ctx.strokeStyle = 'cyan';
        this.ctx.lineWidth = 1;
        this.ctx.textAlign = 'left';
        const infoTooltip= String('\u21D0')   + ' Tap to remove tooltips';
        const scoreTooltip = String('\u21D0') + ' Score table';
        const angleTooltip = 'Tap to adjust angle ' +  String('\u21D2');
        const powerTooltip = String('\u21D1') + ' Hold and release to adjust power';
        // Adjust these positions and texts based on your buttons
        // this.drawTooltip(20, canvasHeight - 635,  powerTooltip);
        // this.drawTooltip(940, canvasHeight - 10,  angleTooltip);
        // this.drawTooltip(145, canvasHeight - 690, scoreTooltip);
        // this.drawTooltip(870, canvasHeight - 690, infoTooltip);
        this.ctx.restore();
      } 
  }

  getPlayerAccuracy(player: Player): number {
    const shots = player.shots ?? 0;
    const points = player.points ?? 0;

    if (shots === 0) {
      return 0;
    }

    return Math.round((points / (shots * 3)) * 100);
  }

  private getAllPlayers(): PlayerWithTeam[] {
    return [
      ...this.team1Players.map(player => ({ ...player, teamName: this.team1.name })),
      ...this.team2Players.map(player => ({ ...player, teamName: this.team2.name })),
    ];
  }

  private getRankedPlayers(): PlayerWithTeam[] {
    return [...this.getAllPlayers()].sort((a, b) => {
      const pointsDelta = (b.points ?? 0) - (a.points ?? 0);
      if (pointsDelta !== 0) {
        return pointsDelta;
      }

      const accuracyDelta = this.getPlayerAccuracy(b) - this.getPlayerAccuracy(a);
      if (accuracyDelta !== 0) {
        return accuracyDelta;
      }

      return (a.shots ?? 0) - (b.shots ?? 0);
    });
  }

  
}
