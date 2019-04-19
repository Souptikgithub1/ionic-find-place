import { Component, OnInit, OnDestroy } from '@angular/core';
import { Place } from '../models/place.model';
import { PlacesService } from '../places.service';
import { IonItemSliding } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy {
  offers: Place[];
  offersSub: Subscription;

  isLoading: boolean;

  constructor(private placesService: PlacesService,
              private router: Router) { }

  ngOnInit() {
    this.offersSub = this.placesService.places.subscribe(offers => this.offers = offers);
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onEdit(offerId, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/', 'places', 'tabs', 'offers', 'edit', offerId]);
    console.log(offerId);
  }

  ngOnDestroy(): void {
    if(!!this.offersSub) {
      this.offersSub.unsubscribe();
    }
  }
}
