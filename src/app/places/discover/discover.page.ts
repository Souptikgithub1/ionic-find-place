import { Component, OnInit, OnDestroy } from "@angular/core";
import { PlacesService } from "../places.service";
import { Place } from "../models/place.model";
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: "app-discover",
  templateUrl: "./discover.page.html",
  styleUrls: ["./discover.page.scss"]
})
export class DiscoverPage implements OnInit, OnDestroy {
  places: Place[] = [];
  listedLoadedPlaces: Place[] = [];
  relevantPlaces: Place[] = [];
  placesSub: Subscription;
  choosenFilter: 'all' | 'bookable';

  isLoading: boolean;

  constructor(private placesService: PlacesService,
              private authService: AuthService) {}

  ngOnInit() {
    let fetchedUserId: string;
    this.placesSub = this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.placesService.places;
      })
    ).subscribe(places => {
      this.places = places;
      if(this.choosenFilter === 'all') {
        this.relevantPlaces = this.places;
      }else {
        this.relevantPlaces = this.places.filter(place => place.userId !== fetchedUserId);
      }
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    console.log(event.detail);
    this.authService.userId.pipe(take(1)).subscribe(userId => {
      if(event.detail.value === 'all') {
        this.relevantPlaces = this.places;
        this.choosenFilter = "all";
      }else {
        this.relevantPlaces = this.places.filter(place => place.userId !== userId);
        this.choosenFilter = 'bookable';
      }
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  ngOnDestroy() {
    if(!!this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }
}
