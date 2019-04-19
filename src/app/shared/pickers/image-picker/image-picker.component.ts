import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { Capacitor, Plugins, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @ViewChild('filePicker') filePicker: ElementRef<HTMLInputElement>;
  useFilePicker: boolean;
  @Output('pickImage') pickImage = new EventEmitter<string | File>();
  selectedImage: string;
  @Input('showPreview') showPreview: boolean = false;

  constructor(private platform: Platform) { }

  ngOnInit() {
    if(this.platform.is('mobile') && !this.platform.is('hybrid') || this.platform.is('desktop')) {
      this.useFilePicker = true;
    }
  }

  onPickImage() {
    if (!Capacitor.isPluginAvailable('Camera')) {
      this.filePicker.nativeElement.click();
      return;
    }
    Plugins.Camera.getPhoto({
      quality: 100,
      source: CameraSource.Prompt,
      correctOrientation: true,
      // height: 320,
      // width: 600,
      resultType: CameraResultType.Base64
    }).then(image => {
      this.selectedImage = image.base64Data;
      this.pickImage.emit(image.base64Data);
    }).catch(err => {
      console.log(err);
      if (this.useFilePicker) {
        this.filePicker.nativeElement.click();
      }
      return false;
    });
  }

  onFileChoosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.pickImage.emit(pickedFile);
    }
    fr.readAsDataURL(pickedFile);
  }

}
