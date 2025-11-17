export enum ContactCategory {
  PhoneNumber = 'phone-number',
  Instagram = 'instagram',
  Facebook = 'facebook',
  Line = 'line',
  Website = 'website',
  Other = 'other',
}

export interface ContactInfo {
  category: ContactCategory;
  content: string;
  href: string;
}
