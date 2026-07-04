import { ShopDraft } from '@prisma/client';
import {
  IsString,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

type AllowedShopDraftFields = Pick<
  ShopDraft,
  | 'title'
  | 'subtitle'
  | 'description'
  | 'contactInfo'
  | 'discount'
  | 'workSchedules'
  | 'address'
  | 'longitude'
  | 'latitude'
  | 'thumbnailKey'
  | 'images'
>;

export type UpdateFieldPayload = {
  [K in keyof AllowedShopDraftFields]: {
    fieldName: K;
    value: AllowedShopDraftFields[K];
  };
}[keyof AllowedShopDraftFields];

// 自定義裝飾器：根據欄位名稱檢查值是否符合預期型別
function IsValidFieldValue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidFieldValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const fieldName = obj.fieldName as keyof AllowedShopDraftFields;

          // 定義欄位與執行時型別的對照表
          const typeMap: Record<keyof AllowedShopDraftFields, string> = {
            title: 'string',
            subtitle: 'string',
            description: 'string',
            discount: 'string',
            address: 'string',
            thumbnailKey: 'string',
            longitude: 'number',
            latitude: 'number',
            contactInfo: 'array', // Prisma 的 Json 在這裏預期是 array
            workSchedules: 'array',
            images: 'array',
          };

          const expectedType = typeMap[fieldName];
          if (!expectedType) return false; // 不在白名單內

          if (expectedType === 'array') {
            return Array.isArray(value);
          }

          if (expectedType === 'string' && value === null) {
            // 如果允許欄位為 null（例如 subtitle 是 String?）
            const nullableFields: (keyof AllowedShopDraftFields)[] = [
              'subtitle',
              'discount',
            ];
            return nullableFields.includes(fieldName);
          }

          return typeof value === expectedType;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          return `欄位 '${obj.fieldName}' 的值型別不正確或該欄位不允許被單獨更新。`;
        },
      },
    });
  };
}

// 調整後的 DTO
export class UpdateFieldDto {
  @IsString()
  id: string;

  fieldName: keyof AllowedShopDraftFields;

  @IsValidFieldValue()
  value: any;
}
