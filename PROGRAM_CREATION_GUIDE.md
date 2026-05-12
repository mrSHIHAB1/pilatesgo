# Program Creation with Multiple Workouts & Cover Image Upload - Postman Guide

## Overview
The program system now supports:
1. **Multiple Workouts**: Each program can have multiple workouts linked to it
2. **Cover Image Upload**: Upload images to Cloudinary when creating or updating programs

---

## 1. Create a Program with Multiple Workouts and Cover Image

### Endpoint
```
POST /api/v1/programs/create
```

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Form Data Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | text | Yes | Name of the program |
| `difficulty` | text | Yes | BEGINNER, INTERMEDIATE, or ADVANCED |
| `description` | text | No | Program description |
| `durationWeeks` | number | No | Duration in weeks |
| `categoryId` | text | No | Category UUID |
| `workoutIds` | array | No | Array of workout UUIDs to include |
| `coverImage` | file | No | Image file (jpg, png, etc.) |
| `thumbnail` | text | No | Thumbnail URL |

### Postman Setup for File Upload

1. **Request Type**: POST
2. **URL**: `http://localhost:3000/api/v1/programs/create`
3. **Headers Tab**:
   - Authorization: Bearer `<token>`
   - Content-Type: multipart/form-data (auto-set by Postman)
4. **Body Tab** → Select **form-data**:
   - `title` (text): "12-Week Full Body Program"
   - `difficulty` (text): "INTERMEDIATE"
   - `description` (text): "A comprehensive 12-week full body pilates program"
   - `durationWeeks` (number): 12
   - `categoryId` (text): "cat-123-uuid"
   - `workoutIds` (array): Add multiple entries
   - `coverImage` (file): Select your image file

### File Upload in Postman

In the **Body** tab with **form-data** selected:
1. Click on the field type dropdown (currently showing "Text")
2. Change from "Text" to "File"
3. Click "Select Files" to choose your image
4. Supported formats: jpg, png, gif, webp

### Success Response (201 Created)
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Program created successfully",
  "data": {
    "id": "program-uuid",
    "title": "12-Week Full Body Program",
    "difficulty": "INTERMEDIATE",
    "description": "A comprehensive 12-week full body pilates program",
    "durationWeeks": 12,
    "categoryId": "cat-123-uuid",
    "creatorId": "user-uuid",
    "coverImage": "https://res.cloudinary.com/..../image.jpg",
    "thumbnail": null,
    "createdAt": "2026-05-12T10:30:00.000Z",
    "updatedAt": "2026-05-12T10:30:00.000Z",
    "workouts": [
      {
        "id": "workout-1",
        "title": "Week 1 - Fundamentals",
        "difficulty": "BEGINNER",
        "duration": 1800
      },
      {
        "id": "workout-2",
        "title": "Week 2 - Core Strength",
        "difficulty": "INTERMEDIATE",
        "duration": 2000
      }
    ]
  }
}
```

---

## 2. Upload Cover Image Only (Dedicated Endpoint)

### Endpoint
```
POST /api/v1/programs/{programId}/upload-cover
```

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### URL
```
POST http://localhost:3000/api/v1/programs/550e8400-e29b-41d4-a716-446655440000/upload-cover
```

### Body (form-data)
- `coverImage` (file): Select image file

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cover image uploaded successfully",
  "data": {
    "id": "program-uuid",
    "title": "12-Week Full Body Program",
    "coverImage": "https://res.cloudinary.com/..../new-image.jpg",
    "workouts": [...]
  }
}
```

---

## 3. Update Program with New Workouts and/or Cover Image

### Endpoint
```
PUT /api/v1/programs/update/{programId}
```

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### URL Example
```
PUT http://localhost:3000/api/v1/programs/update/550e8400-e29b-41d4-a716-446655440000
```

### Form Data (Update with New Workouts)
```
title: "Updated 14-Week Program"
difficulty: "ADVANCED"
durationWeeks: 14
workoutIds: ["workout-1", "workout-3", "workout-5", "workout-7"]
```

### Form Data (Update with New Cover Image)
```
coverImage: (select file)
```

### Response (200 OK)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Program updated successfully",
  "data": {
    "id": "program-uuid",
    "title": "Updated 14-Week Program",
    "difficulty": "ADVANCED",
    "durationWeeks": 14,
    "coverImage": "https://res.cloudinary.com/..../updated-image.jpg",
    "workouts": [
      { "id": "workout-1", "title": "Week 1" },
      { "id": "workout-3", "title": "Week 3" },
      { "id": "workout-5", "title": "Week 5" },
      { "id": "workout-7", "title": "Week 7" }
    ]
  }
}
```

---

## 4. Get a Program with All Its Workouts

### Endpoint
```
GET /api/v1/programs/by-id/{programId}
```

### Example
```
GET /api/v1/programs/by-id/550e8400-e29b-41d4-a716-446655440000
```

### Headers
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Program fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "12-Week Full Body Program",
    "difficulty": "INTERMEDIATE",
    "description": "Comprehensive pilates program",
    "durationWeeks": 12,
    "categoryId": "cat-123",
    "creatorId": "user-123",
    "coverImage": "https://res.cloudinary.com/..../cover.jpg",
    "thumbnail": null,
    "createdAt": "2026-05-12T10:30:00.000Z",
    "updatedAt": "2026-05-12T10:30:00.000Z",
    "workouts": [
      {
        "id": "workout-1",
        "title": "Week 1 - Fundamentals",
        "difficulty": "BEGINNER",
        "duration": 1800,
        "description": "Introduction to pilates basics",
        "exercises": [
          { "id": "ex-1", "name": "Pilates 100" },
          { "id": "ex-2", "name": "Roll Up" }
        ]
      },
      {
        "id": "workout-2",
        "title": "Week 2 - Core Strength",
        "difficulty": "INTERMEDIATE",
        "duration": 2000,
        "exercises": [...]
      }
    ]
  }
}
```

---

## 5. Get All Programs

### Endpoint
```
GET /api/v1/programs/all?page=1&limit=10
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Items per page |
| `search` | string | - | Search in title or description |
| `categoryId` | string | - | Filter by category |
| `difficulty` | enum | - | BEGINNER, INTERMEDIATE, ADVANCED |
| `creatorId` | string | - | Filter by creator |

### Example Request
```
GET /api/v1/programs/all?page=1&limit=5&difficulty=INTERMEDIATE
```

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Programs fetched successfully",
  "data": {
    "data": [
      {
        "id": "program-1",
        "title": "12-Week Full Body",
        "difficulty": "INTERMEDIATE",
        "coverImage": "https://...",
        "workouts": [
          { "id": "w-1", "title": "Week 1" },
          { "id": "w-2", "title": "Week 2" }
        ]
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 5,
    "totalPages": 3
  }
}
```

---

## 6. Error Responses

### 400 Bad Request - No File Uploaded
```json
{
  "statusCode": 400,
  "success": false,
  "message": "No file uploaded"
}
```

### 400 Bad Request - Invalid Difficulty
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED"
}
```

### 404 Not Found - Workout Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "One or more workouts not found"
}
```

### 404 Not Found - Program Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Program not found"
}
```

### 409 Conflict - Title Exists
```json
{
  "statusCode": 409,
  "success": false,
  "message": "Program with this title already exists"
}
```

### 500 Internal Server Error - Upload Failed
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Failed to upload image to Cloudinary"
}
```

---

## Complete Postman Workflow

### Step 1: Create Workouts First
Get workout IDs from creating workouts:
```
POST /api/v1/workouts
```
Save the returned `id` values.

### Step 2: Create Program with Workouts and Image

**Request Type**: POST
**URL**: `http://localhost:3000/api/v1/programs/create`

**Body (form-data)**:
- `title`: "My 8-Week Program"
- `difficulty`: "BEGINNER"
- `description`: "Perfect for beginners"
- `durationWeeks`: 8
- `categoryId`: "cat-uuid"
- `workoutIds`: ["workout-1", "workout-2", "workout-3"]
- `coverImage`: (Select image file)

### Step 3: Retrieve Program with All Details

**Request Type**: GET
**URL**: `http://localhost:3000/api/v1/programs/by-id/{programId}`

You'll get back the complete program with all workouts and their exercises.

### Step 4: Update Program Workouts

**Request Type**: PUT
**URL**: `http://localhost:3000/api/v1/programs/update/{programId}`

**Body (form-data)**:
- `workoutIds`: ["workout-2", "workout-4", "workout-6"]

This replaces all workouts with the new list.

### Step 5: Update Cover Image

**Request Type**: PUT
**URL**: `http://localhost:3000/api/v1/programs/update/{programId}`

**Body (form-data)**:
- `coverImage`: (Select new image file)

Or use the dedicated endpoint:

**Request Type**: POST
**URL**: `http://localhost:3000/api/v1/programs/{programId}/upload-cover`

**Body (form-data)**:
- `coverImage`: (Select image file)

---

## Image Upload Best Practices

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Image Size Recommendations
- **Maximum file size**: 5MB (configurable)
- **Recommended dimensions**: 1200x600px
- **Aspect ratio**: 2:1 (wider than tall for cover images)

### Cloudinary Configuration
The system automatically:
1. Uploads to Cloudinary (configured in `src/app/config/env.ts`)
2. Returns the secure URL
3. Deletes the temporary local file
4. Stores the URL in the database

### Getting Image URLs
Once uploaded, the image URL is stored in the `coverImage` field:
```
"coverImage": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/filename.jpg"
```

---

## Key Implementation Details

### Database Relationships

**Program ↔ Workout (One-to-Many)**
- Program has many Workouts
- Workout belongs to one Program
- When updating with `workoutIds`, existing relationships are replaced with new ones

### Workflow for Multiple Workouts

1. **Create Workouts**: Each workout can contain multiple exercises
2. **Create Program**: Link multiple workouts to the program using `workoutIds`
3. **Retrieve Program**: Get full program with all linked workouts and their exercises
4. **Update Workouts**: Replace the workout list by providing new `workoutIds`

### Data Structure Example
```
Program (1)
├── Workout 1
│   ├── Exercise 1
│   ├── Exercise 2
│   └── Exercise 3
├── Workout 2
│   ├── Exercise 4
│   └── Exercise 5
└── Workout 3
    └── Exercise 6
```

---

## Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `title` | Required, min 1 char | "Program title is required" |
| `difficulty` | BEGINNER\|INTERMEDIATE\|ADVANCED | "Difficulty must be..." |
| `durationWeeks` | Optional, positive integer | "Must be positive" |
| `workoutIds` | Optional, array of valid IDs | "One or more workouts not found" |
| `coverImage` | Optional, valid image file | "Failed to upload" |
| `categoryId` | Optional, must exist | "Category not found" |

---

## Testing Tips

1. **Always get valid Workout IDs first**
   - Create or fetch workouts before creating a program

2. **Test file upload separately**
   - Try uploading a cover image to ensure Cloudinary is configured

3. **Verify relationships**
   - Use GET by-id to confirm workouts are linked

4. **Update strategies**
   - Partial updates work for any field
   - `workoutIds` replaces entire list (not append)

5. **Check includes**
   - All GET endpoints automatically include workouts, category, and creator
   - Workouts automatically include their exercises

---

## Common Issues & Solutions

### Issue: "One or more workouts not found"
**Cause**: Invalid workout IDs in `workoutIds` array
**Solution**: Verify IDs exist by fetching workouts list first

### Issue: "No file uploaded" when updating
**Cause**: Forgot to set Content-Type to multipart/form-data
**Solution**: In Postman, use form-data in Body tab

### Issue: Cover image not updating
**Cause**: Using text field instead of file field in form-data
**Solution**: Click type dropdown → change to "File" for coverImage

### Issue: Cloudinary upload fails
**Cause**: Credentials not configured
**Solution**: Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`

### Issue: Workouts not appearing in response
**Cause**: Workouts not connected when creating
**Solution**: Ensure `workoutIds` array contains valid IDs
