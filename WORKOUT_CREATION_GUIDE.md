# Workout Creation with Multiple Exercises - Postman Guide

## Overview
The workout creation system now supports storing multiple exercises in a single workout. This guide shows you how to use Postman to create and manage workouts with exercises.

---

## 1. Create a Workout with Multiple Exercises

### Endpoint
```
POST /api/v1/workouts
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Request Body
```json
{
  "title": "Full Body Pilates Workout",
  "difficulty": "INTERMEDIATE",
  "description": "A comprehensive full body pilates routine focusing on core strength and flexibility",
  "duration": 1800,
  "categoryId": "category-uuid-here",
  "programId": "program-uuid-here",
  "exerciseIds": [
    "exercise-id-1",
    "exercise-id-2",
    "exercise-id-3"
  ]
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Name of the workout |
| `difficulty` | enum | Yes | BEGINNER, INTERMEDIATE, or ADVANCED |
| `description` | string | No | Workout description |
| `duration` | number | No | Duration in seconds |
| `categoryId` | string | No | Category UUID |
| `programId` | string | No | Program UUID |
| `exerciseIds` | array | No | Array of exercise UUIDs to include in the workout |

### Success Response (201 Created)
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Workout created successfully",
  "data": {
    "id": "workout-uuid",
    "title": "Full Body Pilates Workout",
    "difficulty": "INTERMEDIATE",
    "description": "A comprehensive full body pilates routine focusing on core strength and flexibility",
    "duration": 1800,
    "categoryId": "category-uuid-here",
    "programId": "program-uuid-here",
    "creatorId": "user-uuid",
    "createdAt": "2026-05-12T10:30:00.000Z",
    "updatedAt": "2026-05-12T10:30:00.000Z",
    "exercises": [
      {
        "id": "exercise-id-1",
        "name": "Pilates 100",
        "targetArea": "Core",
        "difficulty": "BEGINNER",
        "instructions": "..."
      },
      {
        "id": "exercise-id-2",
        "name": "Roll Up",
        "targetArea": "Spine",
        "difficulty": "INTERMEDIATE",
        "instructions": "..."
      },
      {
        "id": "exercise-id-3",
        "name": "Single Leg Circle",
        "targetArea": "Hip Flexors",
        "difficulty": "INTERMEDIATE",
        "instructions": "..."
      }
    ]
  }
}
```

---

## 2. Create a Workout without Exercises (Add Later)

### Request Body
```json
{
  "title": "Beginner Stretching",
  "difficulty": "BEGINNER",
  "description": "Basic stretching routine for beginners",
  "duration": 600,
  "categoryId": "category-uuid-here"
}
```

This creates a workout that you can add exercises to later using the Update endpoint.

---

## 3. Get a Workout with Its Exercises

### Endpoint
```
GET /api/v1/workouts/{workoutId}
```

### Example
```
GET /api/v1/workouts/550e8400-e29b-41d4-a716-446655440000
```

### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Workout fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Full Body Pilates Workout",
    "difficulty": "INTERMEDIATE",
    "description": "A comprehensive full body pilates routine",
    "duration": 1800,
    "categoryId": "category-uuid",
    "programId": "program-uuid",
    "creatorId": "user-uuid",
    "exercises": [
      {
        "id": "ex-1",
        "name": "Pilates 100",
        "targetArea": "Core",
        "difficulty": "BEGINNER"
      },
      {
        "id": "ex-2",
        "name": "Roll Up",
        "targetArea": "Spine",
        "difficulty": "INTERMEDIATE"
      }
    ],
    "createdAt": "2026-05-12T10:30:00.000Z",
    "updatedAt": "2026-05-12T10:30:00.000Z"
  }
}
```

---

## 4. Update a Workout and Its Exercises

### Endpoint
```
PUT /api/v1/workouts/{workoutId}
```

### Request Body (Add/Replace Exercises)
```json
{
  "title": "Updated Full Body Pilates",
  "difficulty": "ADVANCED",
  "duration": 2100,
  "exerciseIds": [
    "exercise-id-1",
    "exercise-id-4",
    "exercise-id-5"
  ]
}
```

**Note:** When you provide `exerciseIds`, it **replaces** all existing exercises in the workout with the new list.

### Response (200 OK)
Same structure as creation response with updated data.

---

## 5. Get All Workouts (with Exercises)

### Endpoint
```
GET /api/v1/workouts?page=1&limit=10
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of items per page |
| `search` | string | - | Search in title or description |
| `categoryId` | string | - | Filter by category |
| `difficulty` | enum | - | Filter by difficulty level |
| `creatorId` | string | - | Filter by creator |
| `programId` | string | - | Filter by program |

### Example Request
```
GET /api/v1/workouts?page=1&limit=5&difficulty=INTERMEDIATE&categoryId=cat-123
```

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Workouts fetched successfully",
  "data": {
    "data": [
      {
        "id": "workout-1",
        "title": "Full Body Pilates",
        "difficulty": "INTERMEDIATE",
        "exercises": [
          { "id": "ex-1", "name": "Pilates 100" },
          { "id": "ex-2", "name": "Roll Up" }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 5,
    "totalPages": 5
  }
}
```

---

## 6. Error Responses

### 400 Bad Request - Invalid Difficulty
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED"
}
```

### 404 Not Found - Exercise Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "One or more exercises not found"
}
```

### 404 Not Found - Category Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Category not found"
}
```

### 409 Conflict - Workout Title Exists
```json
{
  "statusCode": 409,
  "success": false,
  "message": "Workout with this title already exists"
}
```

---

## Complete Postman Collection Template

### Step 1: Create Exercises First

**POST** `/api/v1/exercises`
```json
{
  "name": "Pilates 100",
  "targetArea": "Core",
  "difficulty": "BEGINNER",
  "categoryId": "cat-123",
  "instructions": "Lie on back, arms extended, pulse them..."
}
```

Save the returned `id` for use in workout creation.

### Step 2: Create Workout with Those Exercises

**POST** `/api/v1/workouts`
```json
{
  "title": "My First Workout",
  "difficulty": "BEGINNER",
  "description": "First workout with 3 exercises",
  "duration": 900,
  "categoryId": "cat-123",
  "exerciseIds": ["ex-1", "ex-2", "ex-3"]
}
```

### Step 3: Retrieve and Verify

**GET** `/api/v1/workouts/{workoutId}`

This will show you all the connected exercises.

### Step 4: Update Exercises (if needed)

**PUT** `/api/v1/workouts/{workoutId}`
```json
{
  "exerciseIds": ["ex-1", "ex-3", "ex-5"]
}
```

This replaces the exercise list with the new one.

---

## Key Implementation Details

### How Multiple Exercises are Stored

1. **One-to-Many Relationship**: Each `Workout` can have many `Exercise` records
2. **Exercise Model**: Has a `workoutId` field that links it to a workout
3. **Data Structure**: When you create a workout with `exerciseIds`, the system:
   - Validates all exercises exist
   - Connects them to the workout
   - Returns the complete workout with all related exercises

### Example Database Structure
```
Workout Table
├── id: uuid
├── title: string
├── difficulty: enum
├── exercises: [Foreign Key to Exercise]

Exercise Table
├── id: uuid
├── name: string
├── workoutId: uuid (Foreign Key to Workout)
├── targetArea: string
├── difficulty: enum
```

---

## Testing Tips

1. **Get Exercise IDs**: First fetch existing exercises with `GET /api/v1/exercises` to get valid IDs
2. **Validate Before Creating**: Always verify exercise IDs exist before creating a workout
3. **Check Relationships**: Use `GET /api/v1/workouts/{id}` to verify exercises are linked
4. **Update Strategy**: Use PUT with new `exerciseIds` array to modify exercises
5. **Authentication**: Ensure your JWT token is valid and passed in Authorization header

---

## Common Issues

### Issue: "One or more exercises not found"
**Solution**: Make sure the `exerciseIds` array contains valid exercise UUIDs that exist in the database.

### Issue: No exercises appearing in response
**Solution**: Verify the `include: { exercises: true }` is in your GET request. All workout endpoints automatically include exercises.

### Issue: Exercises not being updated
**Solution**: Use the PUT endpoint with the `exerciseIds` array. The `set` operation replaces all exercises.
