import { Injectable } from '@angular/core';
import { Booking } from '../models/booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { take, delay, tap, switchMap, map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Util } from 'src/app/Util/util';
import { BookingData } from 'src/app/places/interfaces/booking-data.interface';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private _bookings: BehaviorSubject<Booking[]> = new BehaviorSubject<Booking[]>([]);

    constructor(private authService: AuthService,
                private http: HttpClient) {

    }

    get bookings() {
        return this._bookings.asObservable();
    }

    fetchBookings() {
        return this.authService.userId.pipe(
            take(1),
            switchMap(userId => {
                return this.http.get<{[key: string]: BookingData}>(
                    Util.firebaseUrl + Util.bookingJson + `?orderBy="userId"&equalTo="${userId}"`);
            }),
            map(bookingData => {
                const bookings = [];
                for (const key in bookingData) {
                    if (bookingData.hasOwnProperty(key)) {
                        bookings.push(
                            new Booking(
                                key,
                                bookingData[key].placeId,
                                bookingData[key].userId,
                                bookingData[key].placeTitle,
                                bookingData[key].placeImage,
                                bookingData[key].firstName,
                                bookingData[key].lastName,
                                bookingData[key].guestNumber,
                                new Date(bookingData[key].bookedFrom),
                                new Date(bookingData[key].bookedTo)
                            )
                        );
                    }
                }
                return bookings;
            }),
            tap(bookings => {
                this._bookings.next(bookings);
            })
        );
    }

    add(
        placeId: string,
        placeTitle: string,
        placeImage: string,
        firstName: string,
        lastName: string,
        guestNumber: number,
        dateFrom: Date,
        dateTo: Date
    ) {
        let newBooking;
        let generatedId;
        return this.authService.userId.pipe(
            take(1),
            switchMap(userId => {
                if (!userId) {
                    return;
                }
                newBooking = new Booking(
                    Math.random().toString(),
                    placeId,
                    userId,
                    placeTitle,
                    placeImage,
                    firstName,
                    lastName,
                    guestNumber,
                    new Date(dateFrom),
                    new Date(dateTo)
                );
            return this.http.post<{name: string}>(Util.firebaseUrl + Util.bookingJson, {...newBooking, id: null});
            }),
            switchMap(resData => {
                generatedId = resData.name;
                return this.bookings;
            }),
            take(1),
            tap(bookings => {
                newBooking.id = generatedId;
                this._bookings.next([...bookings, newBooking]);
            }));
    }

    cancel(bookingId: string) {
        return this.http.delete(Util.firebaseUrl + `bookings/${bookingId}.json`)
                        .pipe(
                            switchMap(() => {
                                return this.bookings;
                            }),
                            take(1),
                            tap(bookings => {
                                this._bookings.next([...bookings.filter(b => b.id !== bookingId)]);
                            })
                        );
    }
}