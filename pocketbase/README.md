# PocketBase Configuration for MeetIt App

This document describes the required PocketBase collections and settings for the MeetIt app.

## Database URL

The app is configured to connect to: `http://pocketbase.sigmagram.xyz`

If you want to use a different PocketBase instance, update the URL in: `src/api/pocketbaseSetup.ts`

## Required Collections

### 1. Users Collection (Authentication)

Collection name: `users`  
Type: `Auth`

Fields:
- `name` (text, required)
- `email` (email, required, unique) - Used for login
- `avatar` (file, optional) - Profile picture

### 2. Events Collection 

Collection name: `events`  
Type: `Base`

Fields:
- `title` (text, required) - Event title
- `date` (date, required) - Date and time of the event
- `location` (text, required) - Location name
- `description` (text, optional) - Event description
- `organizer` (relation:users, required) - User who created the event
- `maxAttendees` (number, optional) - Maximum number of attendees allowed
- `allowPlusOne` (boolean, required, default: false) - Whether attendees can bring a +1

### 3. Friendships Collection

Collection name: `friendships`  
Type: `Base`  

Fields:
- `user1` (relation:users, required) - First user in the friendship
- `user2` (relation:users, required) - Second user in the friendship
- `status` (select, required) - Status of the friendship, values: `pending`, `accepted`, `rejected`

Add a unique index:
```
CREATE UNIQUE INDEX idx_unique_friendship ON friendships (user1, user2)
```

### 4. Event Attendees Collection

Collection name: `event_attendees`  
Type: `Base`

Fields:
- `event` (relation:events, required) - The event being attended
- `user` (relation:users, required) - The user attending
- `status` (select, required) - Status of attendance, values: `going`, `maybe`, `not_going`
- `plusOne` (boolean, required, default: false) - Whether the attendee is bringing a +1

Add a unique index:
```
CREATE UNIQUE INDEX idx_unique_attendance ON event_attendees (event, user)
```

### 5. Media Collection (to be implemented)

Collection name: `media`  
Type: `Base`

Fields:
- `event` (relation:events, required) - The event the media belongs to
- `user` (relation:users, required) - The user who uploaded the media
- `file` (file, required) - The media file
- `type` (select, required) - Type of media, values: `photo`, `video`
- `caption` (text, optional) - Caption for the media

### 6. Chat Messages Collection (to be implemented)

Collection name: `messages`  
Type: `Base`

Fields:
- `event` (relation:events, required) - The event the message belongs to
- `user` (relation:users, required) - The user who sent the message
- `text` (text, required) - The message content
- `timestamp` (date, required) - When the message was sent
- `replyTo` (relation:messages, optional) - Reference to a message being replied to

## API Rules

API rules define who can access and modify each collection. Configure these rules in the PocketBase Admin UI.

### Users Collection Rules

```js
// List (view users)
@request.auth.id != ""

// View (single user)
@request.auth.id != "" && (@request.auth.id = id || @request.auth.id ?= @collection.friendships.user1 || @request.auth.id ?= @collection.friendships.user2)

// Create (register)
true

// Update (edit profile)
@request.auth.id = id

// Delete (remove account)
@request.auth.id = id
```

### Events Collection Rules

```js
// List (view events)
@request.auth.id != ""

// View (single event)
@request.auth.id != "" && 
(
  @request.auth.id = organizer || 
  @request.auth.id ?= @collection.event_attendees.user
)

// Create (new event)
@request.auth.id != "" && @request.auth.id = organizer

// Update (edit event)
@request.auth.id != "" && @request.auth.id = organizer

// Delete (remove event)
@request.auth.id != "" && @request.auth.id = organizer
```

### Friendships Collection Rules

```js
// List (view friendships)
@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)

// View (single friendship)
@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)

// Create (send friend request)
@request.auth.id != "" && @request.auth.id = user1

// Update (accept/reject request)
@request.auth.id != "" && @request.auth.id = user2 && status = "pending"

// Delete (remove friendship)
@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)
```

### Event Attendees Collection Rules

```js
// List (view attendees)
@request.auth.id != "" && 
(
  @request.auth.id = user ||
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// View (single attendee)
@request.auth.id != "" && 
(
  @request.auth.id = user ||
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// Create (join event)
@request.auth.id != "" && @request.auth.id = user

// Update (change status)
@request.auth.id != "" && @request.auth.id = user

// Delete (leave event)
@request.auth.id != "" && (@request.auth.id = user || @request.auth.id ?= @collection.events.organizer)
```

### Media Collection Rules

```js
// List (view media)
@request.auth.id != "" && 
(
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// View (single media)
@request.auth.id != "" && 
(
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// Create (upload media)
@request.auth.id != "" && @request.auth.id = user && @request.auth.id ?= @collection.event_attendees.user

// Update (edit caption)
@request.auth.id != "" && @request.auth.id = user

// Delete (remove media)
@request.auth.id != "" && (@request.auth.id = user || @request.auth.id ?= @collection.events.organizer)
```

### Messages Collection Rules

```js
// List (view messages)
@request.auth.id != "" && 
(
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// View (single message)
@request.auth.id != "" && 
(
  @request.auth.id ?= @collection.events.organizer ||
  @request.auth.id ?= @collection.event_attendees.user
)

// Create (send message)
@request.auth.id != "" && @request.auth.id = user && @request.auth.id ?= @collection.event_attendees.user

// Update (edit message)
@request.auth.id != "" && @request.auth.id = user && (created >= @now - 5*60) // Only allow editing within 5 minutes

// Delete (remove message)
@request.auth.id != "" && (@request.auth.id = user || @request.auth.id ?= @collection.events.organizer)
```

## Setting Up PocketBase

1. Create a PocketBase account and set up a new project
2. Create the collections as specified above
3. Configure authentication settings to allow email/password authentication
4. Set up the API rules for each collection
5. Set up storage rules for avatars and media files
6. (Optional) Configure real-time subscriptions for chat messages

## API Usage

The app interacts with these collections through the API services in the `src/api` directory:

- `pocketbaseSetup.ts` - Central configuration file
- `events.ts` - API services for events
- `friendships.ts` - API services for friendships
- Media sharing (to be implemented)
- Chat messaging (to be implemented)

## Schema Export

You can import the schema from the `schema.json` file or use it as a reference when manually creating collections. 