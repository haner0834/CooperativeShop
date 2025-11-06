export interface Shop {
  id: string;
  title: string;
  description: string;
  phoneNumbers: string[];
  googleMapsLink?: string | null;
  imageLinks: string[];
  thumbnailLink: string;
  isOpen: boolean;
  discount?: string | null;
  address: string;
  longitude: number;
  latitude: number;
}
