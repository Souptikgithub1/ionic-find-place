import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlacesService } from '../../places.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController } from '@ionic/angular';
import { Place } from '../../models/place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Subscription } from 'rxjs';
import { BookingService } from 'src/app/bookings/services/booking.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  placesSub: Subscription;
  bookingSub: Subscription;

  isBookable: boolean = true;
  isLoading: boolean;

  constructor(private placesService: PlacesService,
              private activatedRoute: ActivatedRoute,
              private navCtrl: NavController,
              private modalCtrl: ModalController,
              private actionSheetCtrl: ActionSheetController,
              private loadingCtrl: LoadingController,
              private bookingService: BookingService,
              private router: Router,
              private authService: AuthService) { }

  ngOnInit() {
    this.getPlaces();
  }

  getPlaces() {
    this.activatedRoute.paramMap.subscribe(params => {
      if(!params.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.placesSub = this.authService.userId.pipe(
        take(1),
        switchMap(userId => {
          fetchedUserId = userId;
          return this.placesService.getPlace(params.get('placeId'));
        })
      ).subscribe(place => {
        this.place = place;
        this.isBookable = place.userId !== fetchedUserId;
        this.isLoading = false;
      });

    });
  }

  onBookPlace() {
    this.actionSheetCtrl.create({
      header: 'Choose an action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });
    
  }

  openBookingModal(mode: 'select' | 'random') {
    this.modalCtrl.create({
      component: CreateBookingComponent,
      componentProps: {
        selectedPlace: this.place,
        selectedMode: mode
      }
    }).then(modalEl => {
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(res => {
      if(res.role.toLowerCase() === 'confirm') {
        const bookingData = res.data.bookingData
        console.log(res);
        this.loadingCtrl.create({
          message: 'booking...'
        }).then(loaderEL => {
          loaderEL.present();
          this.bookingSub = this.bookingService.add(
              this.place.id,
              this.place.title,
              this.place.imageUrl,
              bookingData.firstName,
              bookingData.lastName,
              bookingData.numberOfGuests,
              bookingData.availableFrom,
              bookingData.availableTo
            ).subscribe(() => {
              loaderEL.dismiss();
              this.router.navigate(['/bookings']);
            });
        });
      }
    });
  }

  onShowFullMap() {
    this.modalCtrl.create({
      component: MapModalComponent,
      componentProps: {
        center: { lat: this.place.location.lat, lng: this.place.location.lng },
        selectable: false,
        searchable: false,
        closeButtonText: 'close',
        title: this.place.location.address
      }
    }).then(modalEl => {
      modalEl.present();
    });
  }

  ngOnDestroy() {
    if(!!this.placesSub) this.placesSub.unsubscribe();
    if(!!this.bookingSub) this.bookingSub.unsubscribe();
  }
}
