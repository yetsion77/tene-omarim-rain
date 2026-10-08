# גשם בטנא עומרים

אתר ציבורי למדידות הגשם המקומיות בטנא עומרים. המבקרים רואים סיכום עונתי, גרף חודשי, מדידות וגלריה. בעל האתר נכנס עם חשבון Google כדי להוסיף מדידות ותמונות.

## הפעלה מקומית

```bash
npm install
npm run dev
```

## פרסום

`npm run build` יוצר את `docs/`. אתר GitHub Pages מתפרסם מענף `main`, תיקיית `/docs`. לאחר שינוי בקוד יש להריץ את הפקודה ולדחוף גם את `docs/`.

## נתונים והרשאות

- Firebase project: `boor-a77ba`, אפליקציית Web בשם `Tene Omarim Rain`.
- Firestore: `sites/teneOmarimRain/rainfallEntries` ו־`sites/teneOmarimRain/gallery`.
- Storage: `tene-omarim-rain/gallery/`.
- כניסת מנהל: Google Authentication, חשבון `yetsion@gmail.com` בלבד.
- קישור לניהול: `https://yetsion77.github.io/tene-omarim-rain/?admin=1`. הקישור פותח את חלון הניהול; באתר הציבורי אין כפתור מנהל. הקישור עצמו אינו הרשאה — כללי Firebase מגבילים כתיבה לחשבון המורשה.
- כללי הגישה נשמרים גם ב־`firestore.rules` וב־`storage.rules`. בעת עדכון שלהם יש לפרסם אותם ב־Firebase Console.

עונת הגשם באתר נמשכת מ־1 באוגוסט עד 31 ביולי. נתוני החצר אינם נתוני תחנה רשמית. האתר אינו מושך נתונים אוטומטית מהשירות המטאורולוגי; הוא מקשר לעמוד הגשם הרשמי בלבד.

Firebase Storage בפרויקט BOOR נמצא במסלול Blaze עם חיוב לפי שימוש מעבר למכסות החינמיות. הוגדרה התראת תקציב של 10 ש״ח; זו התראה ולא מגבלת חיוב.
