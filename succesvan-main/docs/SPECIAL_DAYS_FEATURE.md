# قابلیت قیمت‌گذاری روزهای خاص (Special Days Pricing)

## توضیحات
این فیچر به شما امکان می‌دهد برای روزهای خاص (مثل تعطیلات، جشن‌ها و...) قیمت اضافی تعیین کنید که به صورت خودکار به فاکتور کاربر اضافه می‌شود.

## تغییرات انجام شده

### 1. مدل Office (`model/office.ts`)
- فیلد `extraPrice` به `specialDays` اضافه شد
- این فیلد به صورت پیش‌فرض 0 است و حداقل مقدار آن 0 می‌باشد

```typescript
specialDays: [
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    isOpen: { type: Boolean, required: true, default: false },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String },
    extraPrice: { type: Number, default: 0, min: 0 }, // جدید
  },
]
```

### 2. کامپوننت مدیریت روزهای خاص (`components/dashboard/SpecialDaysManagement.tsx`)
- فیلد ورودی برای `extraPrice` اضافه شد
- نمایش قیمت اضافی در کارت‌های روزهای خاص
- امکان ویرایش و ذخیره قیمت اضافی

### 3. هوک محاسبه قیمت (`hooks/usePriceCalculation.ts`)
تغییرات:
- پارامتر `specialDays` به ورودی‌های هوک اضافه شد
- محاسبه خودکار قیمت روزهای خاص در بازه رزرو
- اضافه شدن `specialDaysPrice` و `specialDaysInfo` به خروجی

```typescript
export function usePriceCalculation(
  startDate: string,
  endDate: string,
  pricingTiers: PricingTier[],
  extraHoursRate: number = 0,
  pickupExtensionPrice: number = 0,
  returnExtensionPrice: number = 0,
  gearExtraCostPerDay: number = 0,
  addOnsPrice: number = 0,
  sellOffer: number = 0,
  specialDays: Array<{
    month: number;
    day: number;
    extraPrice?: number;
    reason?: string;
  }> = []
): PriceCalculationResult | null
```

خروجی:
```typescript
interface PriceCalculationResult {
  totalHours: number;
  totalDays: number;
  extraHours: number;
  pricePerDay: number;
  extraHoursRate: number;
  totalPrice: number;
  breakdown: string;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  addOnsPrice?: number;
  specialDaysPrice?: number; // جدید
  specialDaysInfo?: Array<{  // جدید
    date: string;
    price: number;
    reason?: string;
  }>;
}
```

### 4. فرم رزرو (`components/global/vanListing.backup.tsx`)
- ارسال `specialDays` به هوک `usePriceCalculation`
- نمایش هشدار روزهای خاص در بخش Cost Summary
- نمایش جزئیات هر روز خاص (تاریخ، دلیل، قیمت)
- نمایش مجموع قیمت روزهای خاص در فاکتور

### 5. تایپ‌ها (`types/type.ts`)
- اضافه شدن `extraPrice?: number` به interface `SpecialDay`

## نحوه استفاده

### 1. تنظیم روز خاص در داشبورد
1. به بخش "Special Days Management" بروید
2. یک Office را انتخاب کنید
3. روی "Add Special Day" کلیک کنید
4. اطلاعات روز را وارد کنید:
   - ماه و روز
   - وضعیت باز/بسته بودن
   - ساعات کاری (در صورت باز بودن)
   - دلیل (اختیاری)
   - **قیمت اضافی (Extra Price)** - مبلغ به پوند
5. ذخیره کنید

### 2. نمایش در فرم رزرو
وقتی کاربر تاریخی را انتخاب می‌کند که شامل روز خاص باشد:
- یک هشدار نارنجی رنگ نمایش داده می‌شود
- لیست روزهای خاص با تاریخ، دلیل و قیمت نشان داده می‌شود
- قیمت اضافی به صورت جداگانه در فاکتور نمایش داده می‌شود
- مجموع قیمت نهایی شامل قیمت روزهای خاص است

### 3. مثال استفاده در کد

```typescript
const basePriceCalc = usePriceCalculation(
  startDate,
  endDate,
  pricingTiers,
  extraHoursRate,
  pickupExtensionPrice,
  returnExtensionPrice,
  gearExtraCostPerDay,
  addOnsPrice,
  sellOffer,
  offices.find((o) => o._id === formData.office)?.specialDays || []
);

// دسترسی به اطلاعات روزهای خاص
if (basePriceCalc?.specialDaysInfo && basePriceCalc.specialDaysInfo.length > 0) {
  console.log('Special days detected:', basePriceCalc.specialDaysInfo);
  console.log('Total special days price:', basePriceCalc.specialDaysPrice);
}
```

## مثال‌های کاربردی

### مثال 1: تعطیلات کریسمس
- تاریخ: 25 دسامبر (month: 12, day: 25)
- دلیل: "Christmas Holiday"
- قیمت اضافی: £50
- نتیجه: اگر رزرو شامل 25 دسامبر باشد، £50 به فاکتور اضافه می‌شود

### مثال 2: سال نو
- تاریخ: 1 ژانویه (month: 1, day: 1)
- دلیل: "New Year's Day"
- قیمت اضافی: £75
- نتیجه: اگر رزرو شامل 1 ژانویه باشد، £75 به فاکتور اضافه می‌شود

### مثال 3: رزرو چند روزه با روزهای خاص
اگر کاربر از 24 دسامبر تا 2 ژانویه رزرو کند:
- 25 دسامبر (کریسمس): +£50
- 1 ژانویه (سال نو): +£75
- **مجموع قیمت اضافی: £125**

## نکات مهم

1. **قیمت اضافی به ازای هر روز است** - اگر یک روز خاص در بازه رزرو باشد، فقط یک بار قیمت آن اضافه می‌شود

2. **محاسبه خودکار** - هوک به صورت خودکار تمام روزهای بین startDate و endDate را چک می‌کند

3. **نمایش شفاف** - کاربر قبل از تکمیل رزرو، تمام روزهای خاص و قیمت‌های آنها را می‌بیند

4. **لاگ کنسول** - برای دیباگ، اطلاعات روزهای خاص در کنسول نمایش داده می‌شود:
   ```
   Special Days Price: £125
   Special Days Info: [
     { date: "12/25", price: 50, reason: "Christmas Holiday" },
     { date: "1/1", price: 75, reason: "New Year's Day" }
   ]
   ```

## تست کردن

برای تست این فیچر:

1. در داشبورد یک روز خاص با قیمت اضافی ایجاد کنید
2. در فرم رزرو، تاریخی را انتخاب کنید که شامل آن روز باشد
3. بررسی کنید که:
   - هشدار روز خاص نمایش داده شود
   - قیمت اضافی در فاکتور نشان داده شود
   - مجموع قیمت نهایی صحیح باشد
4. کنسول مرورگر را چک کنید برای لاگ‌های محاسبات

## پشتیبانی

در صورت بروز مشکل:
1. کنسول مرورگر را بررسی کنید
2. مطمئن شوید که Office انتخاب شده دارای specialDays است
3. بررسی کنید که تاریخ‌های انتخابی صحیح هستند
4. مقادیر extraPrice باید عدد مثبت باشند
