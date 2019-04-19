import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, OnDestroy, Input } from '@angular/core';
import { ModalController, IonSearchbar } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { GoogleMapsService } from '../service/google-maps-service/google-maps.service';
import { Coordinates } from '../../places/models/location.model';
import { Plugins } from '@capacitor/core';


@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapElementRef: ElementRef;
  @ViewChild('placeSearchInput') searchInputElementRef: IonSearchbar;
  clickListener: any;
  dragListener: any;
  googleMaps: any;
  markers: any[];
  marker: any;
  map: any;

  @Input('center') center: Coordinates = {lat: -34.397, lng: 150.644};
  @Input('selectable') selectable = true;
  @Input('searchable') searchable = true;
  @Input('closeButtonText') closeButtonText = 'Cancel';
  @Input('title') title = 'Pick Location';


  search: string;
  constructor(private googleMapsService: GoogleMapsService,
              private ModalCtrl: ModalController,
              private renderer: Renderer2) { }

  ngOnInit() {}

  ngAfterViewInit() {
    this.googleMapsService.getGoogleMaps()
        .then(googleMaps => {
          this.googleMaps = googleMaps;
          const mapEL = this.mapElementRef.nativeElement;
          this.map = new googleMaps.Map(mapEL, {
            center: this.center,
            zoom: 16
          });
          

          //when map initializes blank
          this.googleMaps.event.addListenerOnce(this.map, 'idle', () => {
            this.renderer.addClass(mapEL, 'visible');
            this.marker = new googleMaps.Marker({
              position: this.center,
              map: this.map,
              title: 'Current Location'
            });
            this.initAutoComplete();
          });

          // this.googleMaps.event.addListenerOnce(this.map, 'tilesloaded', () => {
          // });

          this.dragListener = this.map.addListener('dragstart', event => {
            if (!!this.searchInputElementRef) {
              this.searchInputElementRef.getInputElement().then(inputEl => {
                inputEl.blur();
              });
            }
          });

          if(!!this.selectable) {
            this.clickListener = this.map.addListener('click', event => {
              console.log('clicked');
              const selectedCoords: Coordinates = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
              }
              //setting the marker
              this.marker = new googleMaps.Marker({
                position: selectedCoords,
                map: this.map,
                title: 'Picked Location'
              });
              this.marker.setMap(this.map);
              this.ModalCtrl.dismiss(selectedCoords);
            });
          } else {
            this.marker = new googleMaps.Marker({
              position: this.center,
              map: this.map,
              title: 'Picked Location'
            });
            this.marker.setMap(this.map);
          }
        })
        .catch(err => console.log(err));
  }

  initAutoComplete() {
    if (!!this.searchInputElementRef) {
      this.searchInputElementRef.getInputElement().then(inputEl => {
        const searchBox = new this.googleMaps.places.SearchBox(inputEl);
        this.map.addListener('bounds_changed', () => {
          searchBox.setBounds(this.map.getBounds());
        });

        this.markers = [];
        searchBox.addListener('places_changed', () => {
          const places: any[] = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }
          this.markers.forEach(marker => {
            marker.setMap(null);
          });
          this.markers = [];

          const bounds = new this.googleMaps.LatLngBounds();
          places.forEach(place => {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
            const icon = {
              url: place.icon,
              size: new this.googleMaps.Size(71, 71),
              origin: new this.googleMaps.Point(0, 0),
              anchor: new this.googleMaps.Point(17, 34),
              scaledSize: new this.googleMaps.Size(25, 25)
            };
            this.markers.push(new this.googleMaps.Marker({
              map: this.map,
              icon: icon,
              title: place.name,
              position: place.geometry.location
            }));

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }

          });
          this.map.fitBounds(bounds);
        });
      });
    }
  }

  onSearchPlace(e) {
    const placeName = e.target.value;
    const request = {
      query: placeName,
      fields: ['name', 'geometry'] 
    };
    const service = new this.googleMaps.places.PlacesService(this.map);
    service.findPlaceFromQuery(request, (results, status) => {
      if (status === this.googleMaps.places.PlacesServiceStatus.OK) {
        for (let i = 0 ; i < results.length ; i++) {
          new this.googleMaps.Marker({
            map: this.map,
            position: results[i].geometry.location
          });
        }
        this.map.setCenter(results[0].geometry.location);
      }
    });
  }
  

  onCancel() {
    this.ModalCtrl.dismiss();
  }
  
  ngOnDestroy() {
    if(!!this.clickListener) {
      this.googleMaps.event.removeListener(this.clickListener);
    }
    if (!!this.dragListener) {
      this.googleMaps.event.removeListener(this.dragListener);
    }
  }

}
