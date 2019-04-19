import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { PlaceLocation, Coordinates } from '../../../places/models/location.model';
import { of } from 'rxjs';
import { GoogleMapsService } from '../../service/google-maps-service/google-maps.service';
import { Plugins, Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output('pickLocation') pickLocation: EventEmitter<PlaceLocation> = new EventEmitter<PlaceLocation>();
  selectedLocationImage: string;
  selectedLocation: Coordinates;
  isLoading: boolean;
  @Input('showPreview') showPreview: boolean = false;
  
  constructor(private modalCtrl: ModalController,
              private googleMapsService: GoogleMapsService,
              private actionSheetCtrl: ActionSheetController,
              private alertCtrl: AlertController) { }

  ngOnInit() {}

  onPickLocation() {
    this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto Locate',
          handler: () => this.locateUser()
        },
        {
          text: 'Pick on Map',
          handler: () => this.pickLocationOnMap()
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEL => {
      actionSheetEL.present();
    });
  }

  private locateUser() {
    if(!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    this.isLoading = true;
    Plugins.Geolocation.getCurrentPosition()
                       .then(geoPosition => {
                         const coords: Coordinates = { lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude}
                         this.createPlace(coords.lat, coords.lng);
                        })
                       .catch(err => {
                        this.showErrorAlert();
                        this.isLoading = false;
                       });
  }

  private showErrorAlert() {
    this.alertCtrl.create({
      header: 'Could not fetch loacation',
      message: 'Please use the map to pick a location'
    }).then(alertEL => alertEL.present());
  }

  private pickLocationOnMap() {
    if (!!this.selectedLocation) {
      this.openMap(this.selectedLocation);
    } else {
      Plugins.Geolocation.getCurrentPosition()
                       .then(geoPosition => {
                          this.openMap({
                            lat: geoPosition.coords.latitude,
                            lng: geoPosition.coords.longitude
                          });
                       })
                       .catch(err => {
                          this.openMap();
                       });
    }
  }

  private openMap(coordinate?: Coordinates) {
    let modalCreatePromise: Promise<HTMLIonModalElement>;

    if (!!coordinate) {
      modalCreatePromise = this.modalCtrl.create({
        component: MapModalComponent,
        componentProps: {
          center: coordinate
        }
      });
    } else {
      modalCreatePromise = this.modalCtrl.create({
        component: MapModalComponent
      });
    }

    modalCreatePromise.then(modalEL => {
      modalEL.onDidDismiss()
             .then(modalData => {
                if(!modalData.data) {
                  return;
                }
                const coords: Coordinates = {
                  lat: modalData.data.lat,
                  lng: modalData.data.lng
                };
                this.selectedLocation = coords;
                this.createPlace(coords.lat, coords.lng);
               
             });
      modalEL.present();
    });
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${environment.googleMapsApiKey}`;
  }

  private createPlace(latitude: number, longitude: number) {
    const pickedLocation: PlaceLocation = {
      lat: latitude,
      lng: longitude,
      address: null,
      staticMapImageUrl: null
    };
    this.isLoading = true;
    this.googleMapsService.getAddress(latitude, longitude)
        .pipe(
          switchMap(address => {
            pickedLocation.address = address;
            return of(this.getMapImage(pickedLocation.lat, pickedLocation.lng, 14));
          })
        ).subscribe(staticMapImageUrl => {
          pickedLocation.staticMapImageUrl = staticMapImageUrl;
          this.selectedLocationImage = staticMapImageUrl;
          this.isLoading = false;
          this.pickLocation.emit(pickedLocation);
        });
  }

}
