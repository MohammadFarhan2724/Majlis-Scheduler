# Majlis Scheduler

[![CI](https://github.com/MohammadFarhan2724/Majlis-Scheduler/actions/workflows/ci.yml/badge.svg)](https://github.com/MohammadFarhan2724/Majlis-Scheduler/actions/workflows/ci.yml)

A mobile-first web app where organizers announce **majlis** and **mehfil** (religious gatherings) in Barabanki, Uttar Pradesh, so that no two gatherings are booked at the same time. Everyone can see what is coming up, and the app says clearly when a time slot is already taken.

## Live app

**http://majlisscheduler.duckdns.org/**

Open it on your phone. It works on Android and iPhone, and in any browser.

## Why this app exists

In our city, organizers announce their majlis in advance so that nobody else holds a majlis at the same time. Doing this by hand is slow and confusing. This app replaces the phone calls and messages with one public calendar:

- Organizers book a slot with a simple form.
- The announcement is public, like a digital notice board.
- If someone tries to take a booked slot, the app stops them.

The app is built for people aged 14 to 75+, so it is simple, has large buttons, a text size slider, and works in **English, Hindi and Urdu** (Urdu is shown right to left).

## Features

**For everyone**
- Upcoming majalis and mehfils as cards, soonest first, with the Gregorian and Islamic date
- Search and filters by date, venue and type
- Full details page with the pamphlet (Majlis Parcha), venue map link, and the default request to attend on time
- Share a majlis on WhatsApp, and add it to Google Calendar or any calendar app
- English, Hindi and Urdu, with right-to-left layout
- Light and dark mode (follows the phone's setting), and a text size slider
- Installable as an app on the phone home screen (PWA)

**For organizers (login with a mobile number)**
- Schedule a majlis or mehfil: type, Isaal e Sawaab names, Sogwaran, Khitabat, venue, date, time and pamphlet photo
- Own calendar picker showing Gregorian and Islamic dates, with full days marked
- My Account page: Upcoming and Completed tabs, edit and delete your own announcements only
- Forgot password and change password

**For the admin**
- Manage venues (names in three languages and a Google Maps link)
- Set the Islamic months by moon sighting
- Reset a user's password after verifying them by phone

## How booking works

The rules are the same for the whole city:

| Part of the day | Slots |
|---|---|
| Morning | 8:30, 9:00, 9:30, 10:00, 10:30 AM |
| Afternoon | 12:30 PM, 1:00 PM, After Namaz e Zohrain |
| Evening | 7:00, 7:15, 7:30, 8:00 PM, After Namaz e Maghribain |

- Only one booking per part of the day. If one morning slot is taken, the whole morning is closed.
- At most two bookings per day.
- Even if two people press the button at the same moment, the database allows only one of them.
- Completed announcements stay in the organizer's account for 7 days, then they are removed.

## Islamic dates

Islamic months start with the moon, so a month can have 29 or 30 days. Instead of trusting a calculation, the admin keeps a small table of month start dates:

- A command fills the next 12 months with an estimate from a library.
- The admin corrects a month and ticks "confirmed" when the moon is announced.
- Month length is worked out automatically, and the estimate is used only when a month has not been entered yet.

## Tech stack

| Part | Technology |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL (Neon) |
| Frontend | React, Vite, React Router |
| Languages | i18next, react-i18next |
| Images | Pillow (resize, re-save as JPEG, remove hidden photo data, thumbnails) |
| Islamic calendar | hijridate library plus the admin-managed month table |
| Tests and CI | Django test runner, GitHub Actions (PostgreSQL service) |
| Hosting | AWS |

## Project structure

```
.
├── bookings/            Django app: models, API views, serializers, tests, admin
│   ├── management/      Commands: fill_hijri_months, delete_old_bookings
│   └── migrations/
├── config/              Django project settings and URLs
├── frontend/            React app (Vite)
│   ├── public/          Icons, manifest, service worker
│   └── src/
│       ├── components/  Calendar picker, cards, filters, splash, and more
│       ├── pages/       Home, booking form, details, account, login, ...
│       ├── locales/     English, Hindi and Urdu texts
│       └── ...          API helper, theme, dates, sharing
├── .github/workflows/   CI
├── manage.py
└── requirements.txt
```

## API overview

All endpoints are under `/api/`.

| Endpoint | What it does |
|---|---|
| `POST register/`, `POST login/` | Create an account or log in with a mobile number |
| `POST password-reset-request/`, `POST change-password/` | Forgot and change password |
| `GET me/` | Name and mobile of the logged-in user |
| `GET bookings/` | Upcoming announcements (public) |
| `POST bookings/` | Create an announcement (login required) |
| `PATCH` / `DELETE bookings/<id>/` | Edit or delete, only by the owner |
| `GET bookings/mine/?kind=&tab=` | My announcements: upcoming or completed |
| `GET options/` | Majlis types, mehfil types, time slots and venues |
| `GET venues/` | Fixed venues in three languages |
| `GET calendar/?year=&month=` | Each day of a month: Islamic date, booked parts, full or not |
| `GET today/`, `GET hijri/?date=` | Today's date and the Islamic date of any day |

## Run it on your computer

You need Python 3.13, Node.js 22 or newer, and a PostgreSQL database (a free Neon database works).

**1. Clone and set up the backend**

```bash
git clone https://github.com/MohammadFarhan2724/Majlis-Scheduler.git
cd Majlis-Scheduler

python -m venv venv
source venv/Scripts/activate        # Windows Git Bash. On macOS or Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a file named `.env` in the project root (it is ignored by Git):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Then:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py fill_hijri_months
python manage.py runserver
```

**2. Start the frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev -- --host
```

Open `http://localhost:5173`. The dev server forwards `/api` and `/media` to Django on port 8000. To open it on your phone, use the Network address that Vite prints, over the same Wi-Fi.

**3. Production build**

```bash
cd frontend
npm run build
```

## Tests and CI

```bash
python manage.py test
```

Locally the tests use a temporary SQLite database, so you do not need PostgreSQL. They cover the booking rules, double booking protection, the owner lock (nobody can edit or delete another user's announcement), login and password flows, session expiry, image safety, the Islamic date logic and more.

On every push, GitHub Actions starts a real PostgreSQL, checks that no migration is missing, and runs the same tests.

## Admin guide

Open `/admin` and log in with the superuser account.

- **Venues:** add names in English, Hindi and Urdu, and paste the Google Maps link.
- **Hijri months:** after the moon is announced, correct the start date if needed and tick "confirmed". Run `python manage.py fill_hijri_months` now and then to add new months. It never changes existing ones.
- **Password reset requests:** call the user to confirm it is them, select the request, and run "Reset password". It shows a temporary password. The user must choose a new one at the next login.
- **Clean up old announcements:** `python manage.py delete_old_bookings` removes announcements older than 7 days.

## Security and privacy

- Login uses a mobile number. No email is collected, and mobile numbers are never shown publicly.
- Passwords are stored hashed. Sessions end after 30 days of inactivity.
- Users can edit and delete only their own announcements, and this is enforced on the server.
- Login, registration, password reset and booking creation are rate limited.
- Uploaded pamphlets are checked, re-saved as JPEG, resized, and stripped of hidden data such as photo location.

## Roadmap

- HTTPS for the live site (needed for some phone features such as sharing the pamphlet picture and the install prompt)
- Show typed text (Khitabat, venue, names) in Hindi and Urdu as well
- Fixed yearly majalis such as Muharram, Safar and Rabi ul Awwal, managed only by the admin
- A hadith of the day
- AI helpers: read a pamphlet and fill the form, check pamphlets before they go live, smarter search
- Area-based booking rules, so more cities and towns can use the app

## Author

Built by **Mohammad Farhan** for the community in Barabanki.
