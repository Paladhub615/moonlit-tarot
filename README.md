# Moonlit Tarot — ไพ่ทาโรต์ 78 ใบ

เกมเปิดไพ่ภาษาไทย เลือก 1 หรือ 3 ใบ สับไพ่แล้วแตะเปิดทีละใบ พร้อมภาพไพ่ครบ 78 ใบ

**ใช้เฉพาะไพ่ตั้งตรง ไม่มีการสุ่มไพ่กลับหัว** แอนิเมชันพลิกไพ่เป็นการเปิดจากด้านหลังมาด้านหน้าเท่านั้น

- 1 ใบ: ข้อความสำหรับคุณ
- 3 ใบ: อดีต / ปัจจุบัน / แนวโน้ม
- สุ่มไพ่ไม่ซ้ำกันภายในรอบเดียว
- รวมรูปไว้ในโฟลเดอร์ images ไม่ต้องโหลดภาพจากเว็บอื่น
- เป็น HTML / CSS / JavaScript ไม่ต้องติดตั้งแพ็กเกจ ไม่ต้อง build

## อัปขึ้น GitHub Pages

1. แตกไฟล์ ZIP นี้ก่อน
2. เปิด repository ที่ต้องการใช้ หรือสร้าง repository แบบ Public ใหม่ เช่น moonlit-tarot
3. เลือก Add file → Upload files (repository ว่างอาจแสดงลิงก์ uploading an existing file)
4. ลากไฟล์และโฟลเดอร์ทั้งหมดที่แตกออกมาเข้าไป ได้แก่ index.html, style.css, cards.js, app.js, images และไฟล์ประกอบ
5. กด Commit changes
6. ไปที่ Settings → Pages
7. ใน Build and deployment ตั้ง Source เป็น Deploy from a branch
8. เลือก branch ที่อัปโหลดไฟล์ เช่น main และโฟลเดอร์ /(root) แล้วกด Save
9. รอการเผยแพร่เสร็จ แล้วเปิดลิงก์ที่ GitHub แสดงในหน้า Pages

**สำคัญ:** index.html ต้องอยู่หน้าแรกของ repository และ images ต้องอยู่ระดับเดียวกัน อย่าอัปโหลดไฟล์ ZIP ทั้งก้อน และอย่าอัปโหลดโฟลเดอร์ครอบทั้งหมดจน index.html อยู่ลึกลงไปอีกชั้น

หากใช้ repository เดิม ให้อัปโหลดไฟล์ชุดนี้ไปแทนไฟล์ชื่อเดียวกัน และคงโฟลเดอร์ images จากชุดนี้ไว้ด้วย หาก Pages ใช้ branch นี้และ /(root) อยู่แล้ว ไม่ต้องตั้งค่าใหม่

รูปแบบลิงก์: https://ชื่อผู้ใช้.github.io/ชื่อ-repository/

## เปิดบนเครื่อง

หลังแตกไฟล์ สามารถเปิด index.html ด้วยเบราว์เซอร์สมัยใหม่เพื่อทดลองเล่นได้ โดยเก็บไฟล์อื่นและโฟลเดอร์ images ไว้ด้วยกัน

## แก้ไข

- index.html: ข้อความและโครงสร้างหน้าเว็บ
- style.css: สี ขนาด และแอนิเมชัน
- cards.js: ชื่อและความหมายไพ่ภาษาไทย
- app.js: การเลือกจำนวน สับไพ่ และเปิดไพ่
- images/: รูปไพ่ 78 ใบ

## เครดิต

ภาพ Rider–Waite–Smith โดย Pamela Colman Smith, 1909 จาก sixseeds/tarot-api ดู ATTRIBUTION.md
ภาพในชุดนี้ถูกย่อและแปลงเป็น WebP เพื่อให้โหลดเร็วขึ้น โดยคงภาพหน้าไพ่เดิม

เอกสาร GitHub Pages:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
