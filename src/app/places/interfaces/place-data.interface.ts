import { PlaceLocation } from '../models/location.model';

export interface placeData {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  availableFrom: Date;
  availableTo: Date;
  userId: string;
  location: PlaceLocation;
}
