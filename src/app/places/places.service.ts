import { Injectable } from '@angular/core';
import { Place } from './models/place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, find, delay, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Util } from '../Util/util';
import { placeData } from './interfaces/place-data.interface';
import { PlaceLocation } from './models/location.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private placesArrInit: Place[] = [
    new Place(
      "p3",
      "Coorg",
      "Coorg, also known as Kodagu, is a beautiful hill station in the Indian state of Karnataka. It is famous for its coffee plantations, steep hills, countless streams, rich flora & fauna, lush forests and breathtaking views.",
      "https://www.tourmyindia.com/blog/wp-content/uploads/2013/11/idukki.jpg",
      9999.99,
      new Date('2019-01-01'),
      new Date('2019-12-31'),
      'abc',
      null
    ),
    new Place(
      "p1",
      "Goa",
      "Goa is India's smallest state in terms of area and the fourth smallest in terms of population.Goa which is Located on the west coast of India in the region known as the Konkan, it is bounded by the state of Maharashtra to the north, and by Karnataka to the east and south, while the Arabian Sea forms Goas western coast.",
      "https://image3.mouthshut.com/images/Restaurant/Photo/-94048_9068.jpg",
      5999.89,
      new Date('2019-01-01'),
      new Date('2019-12-31'),
      'xyz',
      null
    ),
    new Place(
      "p2",
      "Kodaikanal",
      'Kodaikanal. Kodaikanal is a city near Palani in the hills of the Dindigul district in the state of Tamil Nadu, India. Its name in the Tamil language means "The Gift of the Forest". Kodaikanal is referred to as the "Princess of Hill stations" and has a long history as a retreat and popular tourist destination.',
      "http://hd.wallpaperswide.com/thumbs/mountain_15-t2.jpg",
      7999.99,
      new Date('2019-01-01'),
      new Date('2019-12-31'),
      'abc',
      null
    ),
    new Place(
      "p4",
      "Ooty",
      "City Description of Ooty, Karnataka. Ooty, in the Southern Indian State of Karnataka, is called the 'Queen of hill stations' and is the capital of Nilgiris district. It is one of the most popular tourist resorts in India. Nilgiris means 'Blue Mountains'.",
      "https://image3.mouthshut.com/images/Restaurant/Photo/-78145_8777.jpg",
      11999.99,
      new Date('2019-01-01'),
      new Date('2019-12-31'),
      'xyz',
      null
    )
  ];

  private _places: BehaviorSubject<Place[]> = new BehaviorSubject([]);

  constructor(private authService: AuthService,
              private http: HttpClient) { }

  get places() {
    return this._places.asObservable();
  }

  fetchPlaces() {
    return this.http.get<{[key: string]: placeData}>(Util.firebaseOfferedPlacesUrl).pipe(
      map(resData => {
        const places = [];
        for(const key in resData) {
          if(resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location 
              )
            );
          }
        }
        return places;
      }),
      tap(places => this._places.next(places))
    );
  }

  getPlace(placeId: string) {
    // return this.places.pipe(take(1), map(places => {
    //   return {...places.find(p => p.id === placeId)};
    // }));
    return this.http.get<placeData>(Util.firebaseUrl + `offered-places/${placeId}.json`)
                    .pipe(map(placeData => {
                      return new Place(
                        placeId,
                        placeData.title,
                        placeData.description,
                        placeData.imageUrl,
                        placeData.price,
                        placeData.availableFrom,
                        placeData.availableTo,
                        placeData.userId,
                        placeData.location
                      );
                    }));
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.http.post<{imageUrl: string, imagePath: string}>('https://us-central1-ionic-find-places.cloudfunctions.net/storeImage', uploadData);
  }

  addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date, location: PlaceLocation, imageUrl: string) {
    let newPlace: Place; 
    let generatedId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          userId,
          location
        );
      return this.http.post<{name: string}>(Util.firebaseOfferedPlacesUrl, {...newPlace, id: null});  
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.places;
      }),
      take(1),
      tap(places => {
        newPlace.id = generatedId;
        this._places.next([...places, newPlace]);              
      })
    );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    return this.places.pipe(
      take(1),
      switchMap(places => {
        if(!places || places.length <= 0) {
          return this.fetchPlaces();
        }else {
          return of(places);
        }
      }),
      switchMap(places => {
        const index = places.findIndex(p => p.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[index];
        updatedPlaces[index] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(
          Util.firebaseUrl + `offered-places/${placeId}.json`,
          {...updatedPlaces[index], id: null});
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );
    
  }
}
