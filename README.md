# TVK Complaint Box – R.K. Nagar Thoguthi

**Tamilaga Vettri Kazhagam** – People's Grievance Platform for R.K. Nagar Thoguthi

🌐 **Live URL:** _(deployed on Vercel)_

---

## Features

- 📢 Submit civic complaints with photo upload
- 🎫 Auto-generated Complaint ID (TVK-YYYYMMDD-XXXX)
- 🔍 Track complaint status in real-time
- 📊 Ward-level dashboard
- 🔐 Password-protected admin panel
- 🌐 Tamil / English language toggle
- 📱 Fully mobile-responsive

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | MongoDB Atlas |
| Photos | Cloudinary |
| Deployment | Vercel |

---

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/tvkdb
JWT_SECRET=your_super_secret_key
ADMIN_USERNAME=tvkadmin
ADMIN_PASSWORD_HASH=<bcrypt hash>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Generate password hash (run once):
```bash
node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"
```

---

## Local Development

```bash
npm install
npx vercel login
npx vercel dev
```

Open: http://localhost:3000

---

## Deploy to Vercel

1. Push code to GitHub
2. Go to https://vercel.com → New Project → Import repo
3. Add all environment variables in Vercel dashboard
4. Click **Deploy**

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/api/complaints` | Submit new complaint |
| GET | `/api/complaints/:complaintId` | Track complaint |
| GET | `/api/complaints/dashboard` | Ward stats |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/complaints` | All complaints (auth) |
| PATCH | `/api/admin/:id` | Update status (auth) |

---

## Admin Panel

Access at: `/admin.html`
- Login with `ADMIN_USERNAME` and your password
- Update complaint statuses
- Filter by ward, category, status

---

*TVK Complaint Box – தமிழக வெற்றிக் கழகம் | R.K. Nagar Thoguthi*
