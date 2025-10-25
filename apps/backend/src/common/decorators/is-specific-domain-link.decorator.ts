import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSpecificDomainLink(
  domain: string,
  options?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSpecificDomainLink',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: any) {
          try {
            const url = new URL(value);
            return url.hostname.endsWith(domain);
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return `${propertyName} must be a valid URL under ${domain}`;
        },
      },
    });
  };
}
