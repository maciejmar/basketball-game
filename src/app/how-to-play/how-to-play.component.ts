import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

type TutorialPhase = 'power' | 'angle' | 'shoot' | 'done';

@Component({
  selector: 'app-how-to-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-to-play.component.html',
  styleUrls: ['./how-to-play.component.scss']
})
export class HowToPlayComponent implements OnInit, OnDestroy {
  @ViewChild('tutorialCanvas', { static: true }) tutorialCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  public phase: TutorialPhase = 'power';
  public chargePower = 0;
  public angle = 45;

  private ball = { x: 60, y: 650, radius: 18, velX: 0, velY: 0 };
  private basket = { x: 1050, y: 320, width: 110, height: 10 };
  private gravity = 0.5;
  private maxChargePower = 30;

  private phaseStartTime = 0;
  private lastTimestamp = 0;
  private gameSpeed = 0.001;
  private animFrameId = 0;
  private phaseTimers: any[] = [];

  private ballImage: HTMLImageElement | null = null;
  private basketUpImage: HTMLImageElement | null = null;
  private basketDownImage: HTMLImageElement | null = null;
  private mockBasketUpImage: HTMLImageElement | null = null;
  private mockBasketDownImage: HTMLImageElement | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private playerImage: HTMLImageElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ctx = this.tutorialCanvas.nativeElement.getContext('2d');
      if (this.ctx) {
        this.tutorialCanvas.nativeElement.width = 1280;
        this.tutorialCanvas.nativeElement.height = 720;
        this.loadImages();
      }
    }
  }

  private loadImages() {
    const assets: { key: string; src: string }[] = [
      { key: 'ballImage',         src: 'assets/ball.png' },
      { key: 'basketUpImage',     src: 'assets/basket_up.png' },
      { key: 'basketDownImage',   src: 'assets/basket_down.png' },
      { key: 'mockBasketUpImage', src: 'assets/mock-basket-up.png' },
      { key: 'mockBasketDownImage', src: 'assets/mock-basket-down.png' },
      { key: 'backgroundImage',   src: 'assets/background-basketball.png' },
      { key: 'playerImage',       src: 'assets/player_4.png' },
    ];
    let loaded = 0;
    assets.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;
      const done = () => { (this as any)[key] = img; if (++loaded === assets.length) this.startTutorial(); };
      img.onload = done;
      img.onerror = done;
    });
  }

  private startTutorial() {
    this.phase = 'power';
    this.chargePower = 0;
    this.angle = 45;
    this.ball = { x: 60, y: 650, radius: 18, velX: 0, velY: 0 };
    this.lastTimestamp = performance.now();
    this.phaseStartTime = this.lastTimestamp;

    this.phaseTimers.push(setTimeout(() => {
      this.phase = 'angle';
      this.chargePower = this.maxChargePower * 0.8;
      this.angle = 0;
      this.phaseStartTime = performance.now();
    }, 5000));

    this.phaseTimers.push(setTimeout(() => {
      this.phase = 'shoot';
      const power = this.maxChargePower * 0.8;
      const shootAngle = 67.5;
      this.ball.velX = power * Math.cos(shootAngle * Math.PI / 180);
      this.ball.velY = -power * Math.sin(shootAngle * Math.PI / 180);
    }, 9000));

    this.animFrameId = requestAnimationFrame(this.draw.bind(this));
  }

  private draw(timestamp: number) {
    this.animFrameId = requestAnimationFrame(this.draw.bind(this));
    const elapsed = (timestamp - this.lastTimestamp) * this.gameSpeed;
    this.lastTimestamp = timestamp;
    const phaseElapsed = timestamp - this.phaseStartTime;

    if (this.phase === 'power') {
      this.chargePower = Math.min(this.maxChargePower * (phaseElapsed / 5000), this.maxChargePower);
    } else if (this.phase === 'angle') {
      this.angle = Math.min(67.5 * (phaseElapsed / 3000), 67.5);
    } else if (this.phase === 'shoot') {
      this.ball.x += this.ball.velX * elapsed * 60;
      this.ball.y += this.ball.velY * elapsed * 60;
      this.ball.velY += this.gravity * elapsed * 60;
    }

    if (!this.ctx) return;
    const W = this.tutorialCanvas.nativeElement.width;
    const H = this.tutorialCanvas.nativeElement.height;

    this.ctx.clearRect(0, 0, W, H);

    // Background
    if (this.backgroundImage) {
      this.ctx.globalAlpha = 0.3;
      this.ctx.drawImage(this.backgroundImage, 0, 0, W, H);
      this.ctx.globalAlpha = 1;
    }

    // Basket (back)
    if (this.mockBasketUpImage && this.basketUpImage) {
      const buw = this.basketUpImage.width * 0.4;
      const buh = this.basketUpImage.height * 0.4;
      this.ctx.drawImage(this.mockBasketUpImage, this.basket.x - buw / 2, this.basket.y - buh - 70, buw * 1.7, buh * 3.4);
    }

    // Player
    if (this.playerImage) {
      const pw = this.playerImage.width * 0.7;
      const ph = this.playerImage.height * 0.7;
      this.ctx.drawImage(this.playerImage, 20, H - ph - 10, pw, ph);
    }

    // Ball
    if (this.ballImage) {
      this.ctx.drawImage(this.ballImage,
        this.ball.x - this.ball.radius,
        this.ball.y - this.ball.radius,
        this.ball.radius * 2.4,
        this.ball.radius * 2.4);
    }

    // Basket (front)
    if (this.mockBasketDownImage && this.basketUpImage && this.basketDownImage) {
      const buw = this.basketUpImage.width * 0.4;
      const buh = this.basketUpImage.height * 0.4;
      const bdw = this.basketDownImage.width * 0.4;
      this.ctx.drawImage(this.mockBasketDownImage, this.basket.x - 1 - buw / 2, this.basket.y + 9, bdw * 1.7, buh * 2.8);
    }

    // Power bar background
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1200, 50, 20, H - 100);
    // Power bar fill
    this.ctx.fillStyle = 'green';
    const barH = this.chargePower * 20;
    this.ctx.fillRect(1200, H - barH - 50, 20, barH);

    // Pulsing arrows on canvas
    const pulse = (Math.sin(timestamp / 250) + 1) / 2;
    const alpha = 0.5 + pulse * 0.5;

    if (this.phase === 'power') {
      // Arrow pointing at power bar
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('◀', 1145, H - barH - 30);
      // Label
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('Power!', 1050, H - barH - 35);
      this.ctx.globalAlpha = 1;
    } else if (this.phase === 'angle') {
      // Arrow pointing at angle display in controls (top right of canvas)
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('⬇', 870, 60);
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillText('Angle!', 830, 90);
      this.ctx.globalAlpha = 1;
    }
  }

  get arrowRotation(): string {
    return `rotate(${this.angle + 180}deg)`;
  }

  parseToInt(n: number): number {
    return Math.round(n);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
    this.phaseTimers.forEach(t => clearTimeout(t));
  }
}
