import { Component, ElementRef, OnInit, ViewChild, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Player {
  name: string;
  shots: number;
  points: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  private initialBallXPosition = 60;
  private ctx: CanvasRenderingContext2D | null = null;
  private ball = { x: this.initialBallXPosition, y: 650, radius: 18, velX: 0, velY: 0 };
  private initialBallPosition = { x: this.initialBallXPosition, y: 650 };
  private basket = { x: 1050, y: 320, width: 110, height: 10 };// { x: 1100, y: 320, width: 50, height: 10 };
  private gravity = 0.5;
  private chargePower = 0;
  private charging = false;
  private angle = 45;
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
  //mocking images - the images that are really displayed in mocking process
  private mockBasketUpImage:  HTMLImageElement | null = null;
  private mockBasketDownImage:  HTMLImageElement | null = null;
  //
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
  private resetPending = false; 
  private userInteracted = false; 
  private ballExitedTop = false;
  private pointsScored = 0;
  private lastTimestamp = 0;
  private gameSpeed = 0.001; // Introduced game speed constant

  team1Players: Player[] = [
    { name: 'Player 1-1', shots: 0, points: 0 },
    { name: 'Player 1-2', shots: 0, points: 0 },
    { name: 'Player 1-3', shots: 0, points: 0 },
    { name: 'Player 1-4', shots: 0, points: 0 },
    { name: 'Player 1-5', shots: 0, points: 0 },
  ];

  team2Players: Player[] = [
    { name: 'Player 2-1', shots: 0, points: 0 },
    { name: 'Player 2-2', shots: 0, points: 0 },
    { name: 'Player 2-3', shots: 0, points: 0 },
    { name: 'Player 2-4', shots: 0, points: 0 },
    { name: 'Player 2-5', shots: 0, points: 0 },
  ];

  team1Points = 0;
  team2Points = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ctx = this.gameCanvas.nativeElement.getContext('2d');
      if (this.ctx) {
        this.resizeCanvas();
        //Load images
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
        
       // Wait for all images to load before drawing
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
        ];
        let imagesLoaded = 0;
        images.forEach(img => {
          img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === images.length) {
              this.lastTimestamp = performance.now();
              this.draw(this.lastTimestamp);
            }
          };
        });

        window.addEventListener('click', () => this.initializeAudio());
        window.addEventListener('keydown', () => this.initializeAudio());

        window.addEventListener('resize', () => this.resizeCanvas());
      } else {
        console.error('Failed to get canvas context');
      }
    }
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
      console.log('audio initializing');
      this.swooshSound = new Audio('assets/swooh.mp3');
      this.bounceSound = new Audio('assets/bounce.mp3');
      this.rimSound = new Audio('assets/rim.mp3');
      this.scoreSound = new Audio('assets/score.mp3');
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (!this.userInteracted) {
      this.userInteracted = true;
      this.initializeAudio();
    }

    if (event.code === 'Space') {
      this.charging = true;
      this.playerState = 'player_2';
    }
    if (event.code === 'ArrowUp') {
      this.angleCharging = true;
      clearTimeout(this.angleResetTimeout);
    }
    if (event.code === 'KeyQ') {
      this.quitGame();
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.charging = false;
      this.shoot();
      if (this.swooshSound) {
        this.playSound(this.swooshSound);
      }
      this.playerState = 'player_3';
      setTimeout(() => {
        this.playerState = 'player_4';
      }, 1000);
    }
    if (event.code === 'ArrowUp') {
      this.angleCharging = false;
      this.angleResetTimeout = setTimeout(() => {
        this.angle = 45;
      }, 500);
    }
  }

  playSound(sound: HTMLAudioElement) {
    sound.currentTime = 0;
    sound.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }

  shoot() {
    this.ball.velX = this.chargePower * Math.cos(this.angle * Math.PI / 180);
    this.ball.velY = -this.chargePower * Math.sin(this.angle * Math.PI / 180);
    this.ballScored = false;
    this.chargePower = 0;
    this.ballExitedTop = false;
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
      this.ball.x + this.ball.radius < basketRight - 2
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
          this.pointsScored = 3
          this.addPoints(3);
        } else {
          this.pointsScored = 2
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
        }, 1500);
      }
    }
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
    const rimEdgeMargin = 10;

    if (
      this.ball.x + this.ball.radius >= basketLeft - rimEdgeMargin &&
      this.ball.x + this.ball.radius <= basketLeft + rimEdgeMargin &&
      Math.abs(this.ball.y - this.basket.y + 16) < this.basket.height / 2
    ) {
      this.ball.velX = -this.ball.velX;
      this.ball.x = basketLeft - this.ball.radius;
      if (this.rimSound) {
        this.playSound(this.rimSound);
      }
    }

    if (
      this.ball.x - this.ball.radius <= basketRight + rimEdgeMargin &&
      this.ball.x - this.ball.radius >= basketRight - rimEdgeMargin &&
      Math.abs(this.ball.y - this.basket.y + 16) < this.basket.height / 2
    ) {
      this.ball.velX = -this.ball.velX;
      this.ball.x = basketRight + this.ball.radius;
      if (this.rimSound) {
        this.playSound(this.rimSound);
      }
    }
  }

  

  checkCollisionWithTarget() {
    if (!this.targetImage) return;
    const targetWidth = this.targetImage.width * 0.3;
    const targetHeight = this.targetImage.height * 0.5;
    const targetX = this.gameCanvas.nativeElement.width - targetWidth - 30;//targetWidth / 2;
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
    if (this.ball.x != this.initialBallPosition.x) {
      this.shotCount += 1;

      if (this.shotCount >= 100) {
        this.endGame();
        return;
      }

      this.resetBallForNextShot();
      this.resetAngle();
      if (this.currentTeam === 1) {
        this.currentTeam = 2;
      } else {
        this.currentTeam = 1;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 5;
      }
    }
  }

  addPoints(points: number) {
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex];
    currentPlayer.points += points;

    if (this.currentTeam === 1) {
      this.team1Points += points;
    } else {
      this.team2Points += points;
    }
  }

  resetBallForNextShot() {
    console.log('Resetting ball position for next shot');
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex];
    if (this.ball.x != this.initialBallPosition.x) {
      currentPlayer.shots += 1;
    }
    this.ball.x = this.initialBallPosition.x;
    this.ball.y = this.initialBallPosition.y;
    this.ball.velX = 0;
    this.ball.velY = 0;
    this.shaking = false;
    this.shakeStartTime = null;
    this.flashing = false;
    this.resetPending = false;
  }

  resetAngle() {
    console.log('Resetting angle');
    this.angle = 45;
  }

  quitGame() {
    alert('Game has been quit by the user.');
    this.resetGame();
  }

  endGame() {
    
    const sortedTeam1Players = this.team1Players.slice().sort((a, b) => b.points - a.points);
    const sortedTeam2Players = this.team2Players.slice().sort((a, b) => b.points - a.points);

    const team1Scores = sortedTeam1Players.map(player => `${player.name}: ${player.points}`).join(', ');
    const team2Scores = sortedTeam2Players.map(player => `${player.name}: ${player.points}`).join(', ');
    
    const message =`Game over! Team 1: ${this.team1Points} : Team 2: ${this.team2Points}
    Team 1 (${team1Scores})
    Team 2 (${team2Scores})`;

    alert(message);
    this.resetGame();
    
  }

  resetGame() {
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

  draw(timestamp: number) {
    if (!this.ctx || !this.ballImage || !this.basketUpImage || !this.basketDownImage || !this.targetImage || !this.playerImages[this.playerState] 
      || !this.mockBasketUpImage || !this.mockBasketDownImage) return;

    const elapsed = (timestamp - this.lastTimestamp) * this.gameSpeed; // Adjusted elapsed calculation
    this.lastTimestamp = timestamp;

    requestAnimationFrame(this.draw.bind(this));

    const canvasWidth = this.gameCanvas.nativeElement.width;
    const canvasHeight = this.gameCanvas.nativeElement.height;

    if (this.charging) {
      this.chargePower += 0.5 * elapsed * 60; // Normalizing with 60fps
      if (this.chargePower > this.maxChargePower) {
        this.chargePower = 0;
      }
    }

    if (this.angleCharging) {
      this.angle += 1 * elapsed * 60; // Normalizing with 60fps
      if (this.angle > 90) {
        this.angle = 90;
      }
    }

    if (this.charging && this.ball.x === this.initialBallPosition.x) {
      const playerImage = this.playerImages[this.playerState];
      if (playerImage) {
        const playerWidth = playerImage.width * 0.7;
        const playerHeight = playerImage.height * 0.7;
        this.ball.y = canvasHeight - playerHeight - this.ball.radius - 10 + 45;
        
      }
    } else {
      this.ball.x += this.ball.velX * elapsed * 60; // Normalizing with 60fps
      this.ball.y += this.ball.velY * elapsed * 60; // Normalizing with 60fps
      this.ball.velY += this.gravity * elapsed * 60; // Normalizing with 60fps
    }

    if (this.ball.y + this.ball.radius < 0) {
      this.ballExitedTop = true;
    }

    if (this.ball.y + this.ball.radius > canvasHeight) {
      this.ball.y = canvasHeight - this.ball.radius;
      this.ball.velY = -this.ball.velY * 0.7;
      if (this.bounceSound) {
        this.playSound(this.bounceSound);
      }
      if (this.ballScored && !this.resetPending) {
        this.resetPending = true;
        setTimeout(() => this.nextTurn(), 1500);
      }
    }

    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.velX = -this.ball.velX;
      if (this.bounceSound) {
        this.playSound(this.bounceSound);
      }
    }

    if (this.ball.x - this.ball.radius > canvasWidth) {
      this.nextTurn();
    }

    this.checkBasket();
    this.checkCollisionWithRim();

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

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
    this.ctx.drawImage(this.mockBasketUpImage, this.basket.x - basketUpWidth / 2 , this.basket.y - basketUpHeight + shiftBetweenBasketUPandBasketDown, basketUpWidth*1.7, basketUpHeight*3.4);
    //the mockBasketDownImage is displayed below in code, in foreground layer
    


    const playerImage = this.playerImages[this.playerState];
    if (playerImage) {
      const playerWidth = playerImage.width * 0.7;
      const playerHeight = playerImage.height * 0.7;
      this.ctx.drawImage(playerImage, 20, canvasHeight - playerHeight - 10, playerWidth, playerHeight);
    }

    if (this.shaking && this.shakeStartTime !== null) {
      const elapsedTime = performance.now() - this.shakeStartTime;
      if (elapsedTime < this.shakeDuration) {
        const shakeOffset = Math.sin(elapsedTime / 50) * this.shakeAmplitude;
        this.ctx.drawImage(this.ballImage, this.ball.x - this.ball.radius + shakeOffset, this.ball.y - this.ball.radius, this.ball.radius * 2.4, this.ball.radius * 2.4);
      } else {
        this.ctx.drawImage(this.ballImage, this.ball.x - this.ball.radius, this.ball.y - this.ball.radius, this.ball.radius * 2.4, this.ball.radius * 2.4);
      }
    } else {
      this.ctx.drawImage(this.ballImage, this.ball.x - this.ball.radius, this.ball.y - this.ball.radius, this.ball.radius * 2.4, this.ball.radius * 2.4);
    }
    this.ctx.globalAlpha = 0;
    this.ctx.drawImage(this.basketDownImage, this.basket.x - basketDownWidth / 2, this.basket.y, basketDownWidth, basketDownHeight);

    // Draw the foreground basket image (basket_down) positioned to match basket_up
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.mockBasketDownImage, this.basket.x - 1- basketUpWidth / 2 , this.basket.y+9, basketDownWidth*1.7, basketUpHeight*2.8);
    this.ctx.globalAlpha = 1;

    
    this.ctx.globalAlpha = 0;
    this.ctx.fillStyle = "blue";
    this.ctx.rect( 1000, 320, 110, 10 );
    this.ctx.fill();
    //drawing charge power indicator
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1200, 50, 20, canvasHeight - 100);

    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(1200, canvasHeight - this.chargePower * 20 - 50, 20, this.chargePower * 20);
    this.ctx.save();

    // Drawing the angle arrow at the right top edge of the canvas
    this.ctx.save();
    this.ctx.translate(canvasWidth - 300, 60); // Positioning at right top edge
    this.ctx.rotate(-this.angle * Math.PI / 180);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, -5, 50, 5);
    // Draw the arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(47, -10); // Left point of the arrowhead
    this.ctx.lineTo(57, -2);   // Tip of the arrowhead
    this.ctx.lineTo(47, 5);  // Right point of the arrowhead
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    //drawing angle arrow
    // this.ctx.translate(canvasWidth - 60, canvasHeight - 20);
    // this.ctx.rotate(-this.angle * Math.PI / 180);
    // this.ctx.fillStyle = 'black';
    // this.ctx.fillRect(0, -5, 50, 5);
    // this.ctx.beginPath();
    // this.ctx.moveTo(50, -10);
    // this.ctx.lineTo(60, 0);
    // this.ctx.lineTo(50, 10);
    // this.ctx.fill();
    // this.ctx.restore();

    if (this.displayScoreText) {
      this.ctx.fillStyle = 'red';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center'; // Center align text
      this.ctx.fillText(`SCORE ${this.pointsScored} POINTS!`, canvasWidth / 2, canvasHeight / 2);
    }

    // Display current team, player, and round
    const currentPlayer = this.currentTeam === 1 ? this.team1Players[this.currentPlayerIndex] : this.team2Players[this.currentPlayerIndex];
    this.ctx.fillStyle = 'black';
    this.ctx.font = '16px Arial';
    const shotInfoX = 170;
    const shotInfoY = 80;
    this.ctx.fillText(`Team: ${this.currentTeam}`, shotInfoX, shotInfoY - 60);
    this.ctx.fillText(`Player: ${this.currentPlayerIndex + 1}`, shotInfoX, shotInfoY - 40);
    this.ctx.fillText(`Shots: ${currentPlayer.shots}`, shotInfoX, shotInfoY - 20);

    this.checkCollisionWithTarget();
  }

  startCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    this.charging = true;
    this.playerState = 'player_2';
  }

  stopCharge(event?: TouchEvent) {
    if (event) {
      event.preventDefault();
    }
    this.charging = false;
    this.shoot();
    if (this.swooshSound) {
      this.playSound(this.swooshSound);
    }
    this.playerState = 'player_3';
    setTimeout(() => {
      this.playerState = 'player_4';
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
}
