import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { PlaceLocation } from '../../models/location.model';
import { switchMap } from 'rxjs/operators';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      var begin = sliceIndex * sliceSize;
      var end = Math.min(begin + sliceSize, bytesLength);

      var bytes = new Array(end - begin);
      for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {
  form: FormGroup;

  constructor(private placesService: PlacesService,
              private router: Router,
              private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required]
      }),
      description: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(180)]
      }),
      price: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required, Validators.min(1)]
      }),
      fromDate: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required]
      }),
      toDate: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required]
      }),
      location: new FormControl(null, {
        validators: [Validators.required]
      }),
      image: new FormControl(null)
    });
  }

  onCreateOffer() {
    if (!this.form.valid || !this.form.get('image').value) {
      return;
    }
    const formVal = this.form.value;
    this.loadingCtrl.create({
      message: 'Creating Place...'
    }).then(loaderEl => {
      loaderEl.present();

      this.placesService.uploadImage(this.form.get('image').value)
                        .pipe(
                          switchMap(uploadRes => {
                            return this.placesService.addPlace(
                              formVal.title,
                              formVal.description,
                              formVal.price,
                              new Date(formVal.fromDate),
                              new Date(formVal.toDate),
                              formVal.location,
                              uploadRes.imageUrl
                            )
                          })
                        ).subscribe(() => {
                          loaderEl.dismiss();
                          this.form.reset();
                          this.router.navigate(['/places/tabs/offers']);
                        });
    });
    
    
  }

  onLocationPicked(placeLocation: PlaceLocation) {
    this.form.patchValue({
      location: placeLocation
    });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      try {
        if (imageData.includes('image/png')) {
          imageData = imageData.replace('data:image/png;base64,', '');
        } else {
          imageData = imageData.replace('data:image/jpeg;base64,', '');
        }
       imageFile = base64toBlob(imageData, 'image/jpeg');
      } catch (err) {
        console.log(err);
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({
      image: imageFile
    });
  }

}
