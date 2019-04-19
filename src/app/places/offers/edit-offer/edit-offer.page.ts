import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Place } from '../../models/place.model';
import { PlacesService } from '../../places.service';
import { Subscription } from 'rxjs';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit {
  offer: Place;
  offerId: string;
  offerSub: Subscription;
  form: FormGroup;

  isLoading: boolean;

  constructor(private activatedRoute: ActivatedRoute,
              private placesService: PlacesService,
              private loadingCtrl: LoadingController,
              private router: Router,
              private alertCtrl: AlertController) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(param => {
      if(!param.has('offerId')) {
        return;
      }
      this.offerId = param.get('offerId');
      const offerId = param.get('offerId');
      this.isLoading = true;
      this.offerSub = this.placesService
                          .getPlace(offerId)
                          .subscribe(offer => {
                            this.offer = offer;
                            console.log(this.offer);
                            this.form = new FormGroup({
                              title: new FormControl(this.offer.title),
                              description: new FormControl(this.offer.description)
                            });
                            this.isLoading = false;
                          },
                          error => {
                            this.alertCtrl.create({
                              header: 'An Error Occurred!',
                              message: 'Place couldn\'t be fetched. Please try again later',
                              buttons: [
                                {
                                  text: 'Okay',
                                  handler: () => {
                                    this.router.navigate(['places/tabs/offers']);
                                  }
                                }
                              ]
                            }).then(alertEl => {
                              alertEl.present();
                            });
                          });
      
    });
  }

  onEditOffer() {
    console.log(this.form);
    this.loadingCtrl.create({
      message: 'updating...'
    }).then(loaderEl => {
      loaderEl.present();

      this.placesService
        .updatePlace(this.offer.id, this.form.value.title, this.form.value.description)
        .subscribe(() => {
          loaderEl.dismiss();
          this.router.navigate(['/places/tabs/offers']);
        });
    });
  }

}
