import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookingService } from './services/booking.service';
import { Booking } from './models/booking.model';
import { IonItemSliding, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {

  bookings: Booking[];
  bookingsSub: Subscription;
  fetchBookingSub: Subscription;

  isLoading: boolean;

  constructor(private bookingService: BookingService,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController) { }

  ngOnInit() {
    this.bookingsSub = this.bookingService.bookings.subscribe(bookings => {
      this.bookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.fetchBookingSub = this.bookingService.fetchBookings().subscribe(() => {
      this.isLoading = false;
    });
  }

  onCancelBooking(bookingId, slidingBooking: IonItemSliding) {
    slidingBooking.close();

    this.alertCtrl.create({
      header: 'Are you sure',
      message: 'Do you really want to delete this booking?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.loadingCtrl.create({
              message: 'cancelling...'
            }).then(loaderEL => {
              loaderEL.present();
              this.bookingService.cancel(bookingId).subscribe(() => {
                loaderEL.dismiss();
              });
            });
          }
        }
      ]
    }).then(alertEl => {
      alertEl.present();
    });
    
  }

  ngOnDestroy() {
    if(!!this.bookingsSub) this.bookingsSub.unsubscribe();
    if(!!this.fetchBookingSub) this.fetchBookingSub.unsubscribe();
  }
}
