import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SQLiteService } from '../services/sqlite.service';
import { Player } from '../models/player'


interface Team {
  name: string;
  players: Player[];
}

@Component({
  selector: 'app-change-teams',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './change-teams.component.html',
  styleUrls: ['./change-teams.component.scss'],
})
export class ChangeTeamsComponent implements OnInit {
  team1: Team = { name: 'Team 1', players: Array(5).fill({ name: '' }) };
  team2: Team = { name: 'Team 2', players: Array(5).fill({ name: '' }) };

  constructor(private router: Router, private sqliteService: SQLiteService) {}

  ngOnInit() {
    this.loadTeams();
  }

  ngAfterViewInit() {
    this.showBannerAd();
  }

  async showBannerAd() {
    const bannerOptions: BannerAdOptions = {
      adId: 'ca-app-pub-9509918464023539/8867558460', // prod banner ad ID //here is test baner: id:     ca-app-pub-3940256099942544/6300978111
      position: BannerAdPosition.BOTTOM_CENTER,        // Position at bottom center
      adSize: BannerAdSize.BANNER,              // Use a responsive size
      isTesting: false                             // Testing mode enabled                                
    };
    try {
      await AdMob.showBanner(bannerOptions);
      console.log('Banner ad displayed.');
    } catch (error) {
      console.error('Error showing banner ad:', error);
    }
  }


  async saveTeams() {
    await this.sqliteService.saveTeams(this.team1, this.team2);
    alert('Teams saved successfully!');
    this.router.navigate(['/']);
  }

  async loadTeams() {
    const savedTeams = await this.sqliteService.loadTeams();
    if (savedTeams) {
      this.team1 = savedTeams.team1;
      this.team2 = savedTeams.team2;
    }
  }
}
