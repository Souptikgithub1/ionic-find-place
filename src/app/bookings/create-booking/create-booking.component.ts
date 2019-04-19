import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Place } from 'src/app/places/models/place.model';
import { ModalController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input('selectedPlace') selectedPlace: Place; 
  @Input('selectedMode') selectedMode: 'select' | 'random'
  startDate: string;
  endDate: string;

  @ViewChild('f') form: NgForm;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    console.log(this.selectedPlace);
    if(this.selectedMode === 'random') {
      this.startDate = (new Date()).toISOString();
      this.endDate = new Date(new Date(this.startDate).getTime() + 7*24*60*60*1000).toISOString();
    }
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  onBookPlace() {
    this.modalCtrl.dismiss({
      bookingData: {
        firstName: this.form.value['first-name'],
        lastName: this.form.value['last-name'],
        numberOfGuests: this.form.value['guest-number'],
        availableFrom: this.form.value['date-from'],
        availableTo: this.form.value['date-to']
      }
    }, 'confirm');
  }

  isDateValid() {
    const startDate: Date = new Date(this.form.value['date-form']);
    const endDate: Date = new Date(this.form.value['date-to']);

    return endDate > startDate;
  }
}
