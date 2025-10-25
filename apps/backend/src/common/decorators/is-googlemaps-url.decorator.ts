import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsGoogleMapsUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGoogleMapsUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          try {
            const url = new URL(value);

            // normalize host
            const hostname = url.hostname.toLowerCase();

            // Accept official Google Maps hostnames
            return (
              (hostname === 'www.google.com' &&
                url.pathname.startsWith('/maps')) ||
              hostname === 'maps.app.goo.gl' ||
              (hostname.endsWith('.google.com') &&
                url.pathname.startsWith('/maps'))
            );
          } catch {
            return false;
          }
        },
        defaultMessage(_args: ValidationArguments) {
          return `${propertyName} must be a valid Google Maps URL`;
        },
      },
    });
  };
}
