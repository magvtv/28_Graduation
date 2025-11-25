# Guest List Management System

A real-time guest list management system for your graduation party. Built with a JSON backend that can easily be migrated to Supabase or MongoDB.

## Features

- ✅ Real-time guest list management
- ✅ Add/Edit/Delete categories
- ✅ Add/Edit/Delete guests
- ✅ Track expected guest counts
- ✅ Mark guests as exact or approximate counts
- ✅ Add notes to guests
- ✅ Automatic statistics calculation
- ✅ Beautiful admin interface matching your site design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 3. Access the Admin Page

Open your browser and navigate to:
```
http://localhost:3000/guests-admin.html
```

## Usage

1. **View Guest List**: The page automatically loads your current guest list from `public/guests/guests.json`

2. **Add Category**: Click "Add Category" to create a new guest category

3. **Add Guest**: Click "+ Add Guest" within any category to add a new guest

4. **Edit**: Click "Edit" on any category or guest to modify it

5. **Delete**: Click "Delete" to remove a category or guest (with confirmation)

6. **Save Changes**: Click "Save Changes" to persist your updates to the JSON file

7. **Refresh**: Click "Refresh" to reload the data from the server

## API Endpoints

The server provides the following REST API endpoints:

- `GET /api/guests` - Fetch all guests
- `PUT /api/guests` - Update entire guest list
- `POST /api/guests/category` - Add new category
- `DELETE /api/guests/category/:index` - Delete category
- `POST /api/guests/:categoryIndex` - Add guest to category
- `PUT /api/guests/:categoryIndex/:guestIndex` - Update guest
- `DELETE /api/guests/:categoryIndex/:guestIndex` - Delete guest

## Migration to Supabase/MongoDB

The code is structured to make database migration easy:

1. **Current Structure**: All data operations go through the API endpoints in `server.js`

2. **To Migrate to Supabase**:
   - Replace file read/write operations in `server.js` with Supabase client calls
   - Update the database schema to match the JSON structure
   - No changes needed to the frontend JavaScript

3. **To Migrate to MongoDB**:
   - Replace file operations with MongoDB operations using Mongoose or native driver
   - Create schemas matching the JSON structure
   - No changes needed to the frontend JavaScript

The frontend (`js/guests-admin.js`) only communicates with the API, so it will work with any backend that implements the same endpoints.

## File Structure

```
28_Graduation/
├── guests-admin.html      # Admin interface page
├── server.js              # Express API server
├── package.json           # Dependencies
├── public/
│   └── guests/
│       └── guests.json     # Guest data (auto-updated)
├── css/
│   └── admin.css          # Admin page styles
└── js/
    └── guests-admin.js    # Admin page logic
```

## Notes

- All changes are saved to `public/guests/guests.json`
- The server automatically calculates total expected guests
- Last updated timestamp is automatically maintained
- All guest counts are marked as tentative by default

