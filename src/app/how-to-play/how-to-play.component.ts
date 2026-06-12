import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
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
export class HowToPlayComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tutorialCanvas', { static: true }) tutorialCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tutorialScroller') tutorialScroller?: ElementRef<HTMLElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  public phase: TutorialPhase = 'power';
  public chargePower = 0;
  public angle = 45;
  public activeSectionIndex = 0;

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

  ngAfterViewInit() {
    this.updateActiveSection();
  }

  private loadImages() {
    const assets: { key: string; src: string }[] = [
      { key: 'ballImage', src: 'assets/ball.png' },
      { key: 'basketUpImage', src: 'assets/basket_up.png' },
      { key: 'basketDownImage', src: 'assets/basket_down.png' },
      { key: 'mockBasketUpImage', src: 'assets/mock-basket-up.png' },
      { key: 'mockBasketDownImage', src: 'assets/mock-basket-down.png' },
      { key: 'backgroundImage', src: 'assets/background-basketball.png' },
      { key: 'playerImage', src: 'assets/player_4.png' },
    ];
    let loaded = 0;
    assets.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        (this as any)[key] = img;
        if (++loaded === assets.length) {
          this.startTutorial();
        }
      };
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

    if (!this.ctx) {
      return;
    }

    const width = this.tutorialCanvas.nativeElement.width;
    const height = this.tutorialCanvas.nativeElement.height;
    this.ctx.clearRect(0, 0, width, height);

    if (this.backgroundImage) {
      this.ctx.globalAlpha = 0.3;
      this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
      this.ctx.globalAlpha = 1;
    }

    if (this.mockBasketUpImage && this.basketUpImage) {
      const basketUpWidth = this.basketUpImage.width * 0.4;
      const basketUpHeight = this.basketUpImage.height * 0.4;
      this.ctx.drawImage(
        this.mockBasketUpImage,
        this.basket.x - basketUpWidth / 2,
        this.basket.y - basketUpHeight - 70,
        basketUpWidth * 1.7,
        basketUpHeight * 3.4
      );
    }

    if (this.playerImage) {
      const playerWidth = this.playerImage.width * 0.7;
      const playerHeight = this.playerImage.height * 0.7;
      this.ctx.drawImage(this.playerImage, 20, height - playerHeight - 10, playerWidth, playerHeight);
    }

    if (this.ballImage) {
      this.ctx.drawImage(
        this.ballImage,
        this.ball.x - this.ball.radius,
        this.ball.y - this.ball.radius,
        this.ball.radius * 2.4,
        this.ball.radius * 2.4
      );
    }

    if (this.mockBasketDownImage && this.basketUpImage && this.basketDownImage) {
      const basketUpWidth = this.basketUpImage.width * 0.4;
      const basketUpHeight = this.basketUpImage.height * 0.4;
      const basketDownWidth = this.basketDownImage.width * 0.4;
      this.ctx.drawImage(
        this.mockBasketDownImage,
        this.basket.x - 1 - basketUpWidth / 2,
        this.basket.y + 9,
        basketDownWidth * 1.7,
        basketUpHeight * 2.8
      );
    }

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1200, 50, 20, height - 100);
    this.ctx.fillStyle = 'green';
    const barHeight = this.chargePower * 20;
    this.ctx.fillRect(1200, height - barHeight - 50, 20, barHeight);

    const pulse = (Math.sin(timestamp / 250) + 1) / 2;
    const alpha = 0.5 + pulse * 0.5;

    if (this.phase === 'power') {
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('<', 1145, height - barHeight - 30);
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillText('Power!', 1050, height - barHeight - 35);
      this.ctx.globalAlpha = 1;
    } else if (this.phase === 'angle') {
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('v', 870, 60);
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillText('Angle!', 830, 90);
      this.ctx.globalAlpha = 1;
    }
  }

  get arrowRotation(): string {
    return `rotate(${this.angle + 180}deg)`;
  }

  parseToInt(value: number): number {
    return Math.round(value);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  onTutorialScroll(): void {
    this.updateActiveSection();
  }

  scrollTutorial(direction: 'up' | 'down'): void {
    const scroller = this.tutorialScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const nextIndex = direction === 'down' ? 1 : 0;
    const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.tutorial-screen'));
    const targetSection = sections[nextIndex];
    if (!targetSection) {
      return;
    }

    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSectionIndex = nextIndex;
  }

  get tutorialArrowDirection(): 'up' | 'down' {
    return this.activeSectionIndex > 0 ? 'up' : 'down';
  }

  get tutorialArrowLabel(): string {
    return this.activeSectionIndex > 0 ? 'Back to demo' : 'Read controls';
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
    this.phaseTimers.forEach(timer => clearTimeout(timer));
  }

  private updateActiveSection(): void {
    const scroller = this.tutorialScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const midpoint = scroller.scrollTop + scroller.clientHeight / 2;
    const sections = Array.from(scroller.querySelectorAll<HTMLElement>('.tutorial-screen'));
    const currentIndex = sections.findIndex(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      return midpoint >= top && midpoint < bottom;
    });

    if (currentIndex >= 0) {
      this.activeSectionIndex = currentIndex;
    }
  }
}
