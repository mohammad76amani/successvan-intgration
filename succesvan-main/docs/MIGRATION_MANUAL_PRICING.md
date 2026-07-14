# Migration Guide: Manual Pricing Fields

این فایل راهنمای مایگریشن فیلدهای قیمتگذاری دستی برای رزروهای قبلی است.

## 📋 فیلدهای جدید

```typescript
isManualPrice: Boolean (default: false)
manualPricePerDay: Number (nullable)
manualPriceNote: String (nullable)
reservationType: String (enum: ["Office", "Website"])
```

## 🔍 مرحله 1: بررسی وضعیت

ابتدا بررسی کنید چند رزرو نیاز به مایگریشن دارند:

### Postman Request:
```
Method: GET
URL: http://localhost:3000/api/reservations/migrate
```

### پاسخ نمونه:
```json
{
  "success": true,
  "data": {
    "totalReservations": 150,
    "needsMigration": 150,
    "alreadyMigrated": 0
  }
}
```

## ✅ مرحله 2: اجرای مایگریشن

بعد از اطمینان، مایگریشن را اجرا کنید:

### Postman Request:
```
Method: POST
URL: http://localhost:3000/api/reservations/migrate
Headers: 
  Content-Type: application/json
Body: (empty)
```

### پاسخ نمونه:
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "matchedCount": 150,
    "modifiedCount": 150,
    "acknowledged": true
  }
}
```

## 📊 توضیحات پاسخ

- **matchedCount**: تعداد رزروهایی که شرایط مایگریشن را داشتند
- **modifiedCount**: تعداد رزروهایی که واقعاً آپدیت شدند
- **acknowledged**: تایید MongoDB برای انجام عملیات

## 🔒 نکات امنیتی

⚠️ **مهم**: این endpoint فقط برای مایگریشن یکبار مصرف است.

### بعد از اجرای موفق مایگریشن:

1. فایل را حذف کنید:
   ```
   d:\Next\succesvan\app\api\reservations\migrate\route.ts
   ```

2. یا اگر میخواهید نگه دارید، یک middleware امنیتی اضافه کنید:
   ```typescript
   // بررسی admin token
   const token = req.headers.get("authorization");
   if (!token || !isValidAdminToken(token)) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

## 🧪 تست مایگریشن

بعد از اجرای مایگریشن، یک رزرو تصادفی را چک کنید:

### Postman Request:
```
Method: GET
URL: http://localhost:3000/api/reservations?limit=1
```

### بررسی کنید که فیلدهای زیر وجود دارند:
```json
{
  "isManualPrice": false,
  "manualPricePerDay": null,
  "manualPriceNote": null,
  "reservationType": "Website"
}
```

## 📝 لاگ مایگریشن

تاریخ اجرا: [تاریخ را بعد از اجرا وارد کنید]
تعداد رزروهای آپدیت شده: [تعداد را وارد کنید]
وضعیت: [موفق/ناموفق]

## ❓ عیب‌یابی

### خطا: "Migration failed"
- بررسی کنید MongoDB متصل است
- بررسی کنید مدل Reservation آپدیت شده است

### خطا: "modifiedCount: 0"
- احتمالاً همه رزروها قبلاً مایگریت شده‌اند
- با GET endpoint بررسی کنید

### خطا: Connection timeout
- بررسی کنید دیتابیس در دسترس است
- تعداد رزروها زیاد است، ممکن است زمان بیشتری نیاز باشد

## 🎯 نتیجه نهایی

بعد از مایگریشن موفق:
- ✅ همه رزروهای قبلی `isManualPrice: false` دارند
- ✅ همه رزروهای قبلی `manualPricePerDay: null` دارند  
- ✅ همه رزروهای قبلی `manualPriceNote: null` دارند
- ✅ رزروهای جدید با قیمت دستی ادمین به درستی ذخیره می‌شوند
- ✅ می‌توانید رزروها را بر اساس `isManualPrice` فیلتر کنید
- ✅ همه رزروهای قبلی `reservationType: "Website"` دارند
- ✅ رزروهای جدید ادمین `reservationType: "Office"` دارند
- ✅ رزروهای جدید وبسایت `reservationType: "Website"` دارند
- ✅ میتوانید رزروها را بر اساس `reservationType` فیلتر کنید
