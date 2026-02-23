# super-duper-PDFviewer (Chrome Extension)

A minimal PDF viewer which replaces the default grey margins with customizable backgrounds + optional blur & dim effect.

I often use Chrome's built-in PDF viewer to quickly open slides and files from my university classes. I appreciate aesthetics when spending long hours on my computer, so why not make PDF viewing a touch nicer?

In the winter months I like to keep my wallpaper a nice beach background to combat seasonal affective disorder, so I thought instead of the plain gray background when viewing PDFs, I can simulate being on a beach or anywhere nice.

My brain needs color haha.

---

## Supports

- Solid color backgrounds  
- Image backgrounds (local, URL, Unsplash search, Unsplash collection)  
- Video backgrounds (local, URL, Pexels search)  
- Blur + dim controls  
- Rotation frequency (locked / every tab / hourly / daily)  
- Provider keys stored locally (never synced or committed)  

---

## ✨ Features

### Background Types

**Solid Color**

**Image**
- Local file  
- Direct URL  
- Unsplash search (random pick)  
- Unsplash collection  

**Video**
- Local file  
- Direct URL  
- Pexels video search (random pick)  

---

### Controls

- Adjustable blur  
- Adjustable dim overlay  

Rotation frequency:
- Locked  
- Every tab  
- Every hour  
- Every day  

- Press **Enter** inside settings to apply changes  
- Settings dropdown closes automatically after Apply  

---

## API Keys (Optional)

- Unsplash Access Key  
- Pexels API Key  

Stored locally using `chrome.storage.local`  
Never committed or synced.  

---

## 🔑 How to Get API Keys

### Unsplash (Images)

1. Create a developer account at:  
   https://unsplash.com/developers  
2. Create a new application  
3. Copy your Access Key  
4. Paste into Background Settings → Unsplash key → Save  

---

### Pexels (Videos)

1. Create an account at:  
   https://www.pexels.com/api/  
2. Generate an API key  
3. Paste into Background Settings → Pexels key → Save  

---

## 🚀 Installation (Developer Mode)

1. Clone this repository  
2. Open Chrome  
3. Navigate to: chrome://extensions
4. Enable Developer Mode  
5. Click Load unpacked  
6. Select the project folder  

Now any PDF URL ending in `.pdf` will open in this custom viewer.

---

## 🛠 Future Improvements

- Unsplash image grid selector (instead of random)  
- Pexels preview thumbnails  
- Shuffle button  
- Per-domain background presets  
- Background history stack  
- Optional background transitions (fade)  
