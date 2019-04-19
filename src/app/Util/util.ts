export class Util {
    public static firebaseUrl: string = 'https://ionic-find-places.firebaseio.com/';

    //firebase realtime db json files
    public static offeredPlacesJson = 'offered-places.json';
    public static firebaseOfferedPlacesUrl = Util.firebaseUrl + Util.offeredPlacesJson;

    public static bookingJson = 'bookings.json'
}