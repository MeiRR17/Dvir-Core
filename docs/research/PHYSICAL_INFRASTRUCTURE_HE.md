# מחקר תשתית פיזית — Dvir Core
סטטוס: הצעה למחקר בלבד; אין אישור לרכש, התקנה או פריסה. 2026-11-24.

## מטרות
מיפוי ציוד, מיקום פיזי, חשמל, רשת, אחסון, מחשוב וניהול; שמירה על סינון האינטרנט הקיים. כל המחקר נשמר ב-GitHub, ללא סודות, כתובות פרטיות או נתוני קורפוס.

## ציוד ותפקידים
| רכיב | תפקיד | מיקום מוצע | סטטוס |
|---|---|---|---|
| MacBook Pro M1 Max 64GB/2TB | MLX, Whisper, AI workers | עמדת עבודה מאווררת בבית, Ethernet | קיים לפי דיווח |
| MacBook Air M4 16GB | לקוח נייד ופיתוח | נייד | קיים לפי דיווח |
| Windows Ryzen 3600/32GB/GTX1660S | WSL, בדיקות, CPU worker | עמדת מחשב קיימת | קיים לפי דיווח |
| נתב/ONT | חיבור ספק וסינון | נקודת כניסת תקשורת | דגם ומדיניות לא ידועים |
| מתג Ethernet 2.5GbE 5–8 ports | רשת מקומית | ליד נתב או אזור ציוד | אופציונלי; בדיקת NIC וכבלים |
| מתאם USB-C/Thunderbolt Ethernet | חיבור Mac קווי | ליד Mac | לפי צורך |
| NAS 4 bays | אחסון מרכזי, snapshots | מדף מאוורר, יבש, ליד מתג | אופציונלי; לא נבחר דגם |
| Mini PC 16–32GB RAM, SSD 0.5–1TB | control plane, registry, scheduler, monitoring | ליד מתג, מאוורר | אופציונלי; רק אם נדרשת זמינות רציפה |
| UPS line-interactive | נתב, מתג, NAS, Mini PC | מדף נמוך, מאוורר | בחינה לפי עומס מדוד ומשך גיבוי |
| דיסק גיבוי חיצוני מוצפן | עותק מנותק ושחזור | נפרד מה-NAS; עותק נוסף מחוץ לבית לפי מדיניות | נדרש עקרון גיבוי, ציוד לפי קיבולת |
| Cat6 / תיוג / מדף | קישוריות וסדר | תוואי בטוח | לפי מדידה |

## טופולוגיה
Internet + existing filtering -> router/firewall -> Ethernet switch -> Mac / NAS / optional mini PC / Windows.
Clients via approved LAN/Wi-Fi. UPS powers network and storage/control devices, not necessarily heavy compute. No public ports. No filter bypass. If filtering is endpoint-based, each new host must comply independently; if network-based, verify coverage and policy. VPN, DNS, TLS inspection, certificates, GitHub, package registries, model downloads and APIs require compatibility and provider-approved access; never disable TLS verification or route around filtering. Offline operation, approved mirrors and cached dependencies are alternatives.

## מיקום
אזור תשתית בבית סמוך לתקשורת ולחשמל, יבש ומאוורר, לא ארון סגור או חדר שינה אם רעש מפריע. NAS ו-UPS על מדף יציב, מרווחי אוורור לפי יצרן. Mac בעמדת עבודה נגישה. אין לקבוע חדר או תוואי כבלים לפני תרשים בית. חשמל לפי הוראות יצרן וחשמלאי מוסמך בעת צורך.

## תרחישים
A: ציוד קיים + גיבוי חיצוני; מינימום עלות, תלות בשינה של Mac.
B: A + Mini PC; ניהול רציף בעוד AI זמין לפי מצב Mac.
C: B + NAS + UPS + מתג לפי צורך; הפרדת אחסון ומחשוב.
D: הרחבה עתידית לשרת AI ייעודי רק לאחר מדידות.

## קיבולת וגיבוי
קורפוס מדווח 400–500GB אינו אומדן לכל הנתונים. למדוד שימוש, צמיחה, snapshots, מודלים, וידאו, artifacts וגיבויים. RAID אינו גיבוי. לדוגמה בלבד 2x8TB mirror נותן כ-8TB נומינלי לפני overhead; 4x8TB RAID6 נותן כ-16TB נומינלי. תכנון 3-2-1 עם עותק מנותק/מחוץ לאתר לפי רגישות. לא להעלות קורפוס גולמי לענן. לבדוק שחזור. UPS לפי וואטים בפועל, מגבלת W/VA ועקומת זמן ריצה, לא לפי VA בלבד.

## שאלות פתוחות
ספק וסוג סינון (מחשב/נתב/ספק), מערכות הפעלה מכוסות, גישה מאושרת ל-GitHub ולמודלים, מיקום נתב, תשתית Ethernet, שטח מדף, רעש, חשמל, נפח נתונים וצמיחה, תקציב, צורך בזמינות רציפה. אין מדידות או בדיקות פיזיות שבוצעו.
