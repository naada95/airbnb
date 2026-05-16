// mongo/init/01-init.js
// Switch to the airbnb DB and create an app-level user
db = db.getSiblingDB("airbnb")

db.createUser({
	user: process.env.MONGO_APP_USER,
	pwd: process.env.MONGO_APP_PASS,
	roles: [{role: "readWrite", db: "airbnb"}],
});

// _______ USERS Collection _______
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password_hash", "role", "created_at"],
      properties: {

        // ── Fields every user has ──────────────────
        name:          { bsonType: "string" },
        email:         { bsonType: "string", pattern: "^[^@]+@[^@]+\\.[^@]+$" },
        password_hash: { bsonType: "string" },
        role: {
          enum: ["guest", "host", "admin"],
        },
        avatar_url: { bsonType: "string" },
        phone:      { bsonType: "string" },
        is_active:  { bsonType: "bool" },
        created_at: { bsonType: "date" },
        last_login: { bsonType: "date" },

        preferences: {
          bsonType: "object",
          properties: {
            language: { bsonType: "string" },
            currency: { bsonType: "string" },
            timezone: { bsonType: "string" },
          },
        },

        // ── Only present if role === "guest" ───────
        guest_profile: {
          bsonType: "object",
          properties: {
            verified_id:    { bsonType: "bool" },
            wishlist_ids:   {
              bsonType: "array",
              items: { bsonType: "objectId" },
            },
            total_trips:    { bsonType: "int" },
            is_superguest:  { bsonType: "bool" },
          },
        },

        // ── Only present if role === "host" ────────
        host_profile: {
          bsonType: "object",
          properties: {
            is_superhost:       { bsonType: "bool" },
            is_verified:        { bsonType: "bool" },
            response_time: {
              enum: ["within an hour", "within a few hours",
                     "within a day", "a few days or more"],
            },
            response_rate:      { bsonType: "int", minimum: 0, maximum: 100 },
            acceptance_rate:    { bsonType: "int", minimum: 0, maximum: 100 },
            payout_currency:    { bsonType: "string" },
            payout_method: {
              enum: ["bank_transfer", "paypal", "stripe"],
            },
            verifications: {
              bsonType: "array",
              items: {
                enum: ["email", "phone", "government_id",
                       "selfie", "reviews", "work_email"],
              },
            },
            about:              { bsonType: "string" },
            languages_spoken: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
            total_listings:     { bsonType: "int" },
            member_since:       { bsonType: "date" },
          },
        },

        // ── Only present if role === "admin" ───────
        admin_profile: {
          bsonType: "object",
          properties: {
            permissions: {
              bsonType: "array",
              items: {
                enum: ["manage_users", "manage_listings",
                       "manage_bookings", "view_analytics",
                       "super_admin"],
              },
            },
            department: { bsonType: "string" },
          },
        },

      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ "host_profile.is_superhost": 1 });

// _______ LISTINGS Collection _______
db.createCollection("listings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["host", "title", "location", "price_per_night", "room_type", "created_at"],
      properties: {
        title:       { bsonType: "string", minLength: 5 },
        description: { bsonType: "string" },
        property_type: {
          enum: ["Entire apartment", "Private room", "Shared room",
                 "Entire house", "Entire loft", "Hotel room"],
        },
        room_type: {
          enum: ["Entire home/apt", "Private room", "Shared room", "Hotel room"],
        },
        cancellation_policy: {
          enum: ["flexible", "moderate", "strict", "super_strict"],
        },

        accommodates: { bsonType: "int", minimum: 1 },
        bedrooms:     { bsonType: "int", minimum: 0 },
        beds:         { bsonType: "int", minimum: 0 },
        bathrooms:    { bsonType: ["decimal", "double", "int"], minimum: 0 }, // ✅ CORRIGÉ
        // ── Pricing ────────────────────────────────
        price_per_night:  { bsonType: ["decimal", "double", "int"], minimum: 0 }, // ✅ CORRIGÉ
        security_deposit: { bsonType: ["decimal", "double", "int"], minimum: 0 }, // ✅ CORRIGÉ
        cleaning_fee:     { bsonType: ["decimal", "double", "int"], minimum: 0 }, // ✅ CORRIGÉ
        extra_people_fee: { bsonType: ["decimal", "double", "int"], minimum: 0 }, // ✅ CORRIGÉ

        minimum_nights: { bsonType: "int", minimum: 1 },
        maximum_nights: { bsonType: "int", minimum: 1 },
        instant_bookable: { bsonType: "bool" },

        availability: {
          bsonType: "object",
          properties: {
            availability_30:  { bsonType: "int" },
            availability_60:  { bsonType: "int" },
            availability_90:  { bsonType: "int" },
            availability_365: { bsonType: "int" },
          },
        },

        host: {
          bsonType: "object",
          required: ["host_id", "host_name"],
          properties: {
            host_id:                { bsonType: "objectId" },
            host_name:              { bsonType: "string" },
            host_is_superhost:      { bsonType: "bool" },
            host_response_time:     { bsonType: "string" },
            host_response_rate:     { bsonType: "int", minimum: 0, maximum: 100 },
            host_identity_verified: { bsonType: "bool" },
            host_picture_url:       { bsonType: "string" },
            host_verifications:     { bsonType: "array", items: { bsonType: "string" } },
          },
        },

        location: {
          bsonType: "object",
          required: ["city", "country", "coordinates"],
          properties: {
            street:       { bsonType: "string" },
            city:         { bsonType: "string" },
            country:      { bsonType: "string" },
            country_code: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              required: ["type", "coordinates"],
              properties: {
                type:        { enum: ["Point"] },
                coordinates: { bsonType: "array", minItems: 2, maxItems: 2 },
              },
            },
          },
        },

        review_scores: {
          bsonType: "object",
          properties: {
            review_scores_accuracy:      { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_cleanliness:   { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_checkin:       { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_communication: { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_location:      { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_value:         { bsonType: "int", minimum: 0, maximum: 10 },
            review_scores_rating:        { bsonType: "int", minimum: 0, maximum: 100 },
          },
        },

        amenities:  { bsonType: "array", items: { bsonType: "string" } },
        photos:     { bsonType: "array", items: { bsonType: "string" } },
        created_at: { bsonType: "date" },
      },
    },
  },
});

db.listings.createIndex({ "location.coordinates": "2dsphere" });
db.listings.createIndex({ "host.host_id": 1 });
db.listings.createIndex({ price_per_night: 1 });
db.listings.createIndex({ property_type: 1, room_type: 1, beds: 1 });
db.listings.createIndex({ "review_scores.review_scores_rating": -1 });
db.listings.createIndex({ instant_bookable: 1 });

// _______ BOOKINGS collection _______ ✅ VALIDATEUR CORRIGÉ
db.createCollection("bookings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["listing_id", "guest_id", "check_in", "check_out", "status", "total_price"],
      properties: {
        listing_id: { bsonType: "objectId" },
        guest_id:   { bsonType: "objectId" },
        check_in:   { bsonType: "date" },
        check_out:  { bsonType: "date" },
        status: {
          enum: ["pending", "confirmed", "cancelled", "completed"],
        },
        // ✅ CORRIGÉ — accepte decimal (Decimal128), double (Number JS) et int
        total_price:   { bsonType: ["decimal", "double", "int"] },
        // ✅ CORRIGÉ — accepte int et double (JavaScript envoie parfois un float)
        guests_count:  { bsonType: ["int", "double"], minimum: 1 },
        special_notes: { bsonType: "string" },
        created_at:    { bsonType: "date" },
      },
    },
  },
  // ✅ CORRIGÉ — "moderate" au lieu de "strict" pour éviter les blocages sur champs inconnus
  validationLevel: "moderate",
  validationAction: "error",
});

db.bookings.createIndex({ listing_id: 1, check_in: 1, check_out: 1 });
db.bookings.createIndex({ guest_id: 1 });

// _______ REVIEWS collection _______
db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["booking_id", "reviewer_id", "listing_id", "rating", "created_at"],
      properties: {
        booking_id:  { bsonType: "objectId" },
        reviewer_id: { bsonType: "objectId" },
        listing_id:  { bsonType: "objectId" },
        rating: {
          bsonType: "int",
          minimum: 1,
          maximum: 5,
        },
        comment:    { bsonType: "string" },
        created_at: { bsonType: "date" },
      },
    },
  },
});

db.reviews.createIndex({ listing_id: 1 });
db.reviews.createIndex({ booking_id: 1 }, { unique: true });

// _______ SEED — sample documents _______
const hostId  = new ObjectId();
const guestId = new ObjectId();
const adminId = new ObjectId();

db.users.insertMany([
  {
    _id: hostId,
    name: "Fatima Zahra",
    email: "fatima@example.com",
    password_hash: "$2b$10$examplehashhost",
    role: "host",
    avatar_url: "https://example.com/fatima.jpg",
    phone: "+212600000001",
    is_active: true,
    preferences: {
      language: "fr",
      currency: "MAD",
      timezone: "Africa/Casablanca",
    },
    host_profile: {
      is_superhost: true,
      is_verified: true,
      response_time: "within an hour",
      response_rate: 98,
      acceptance_rate: 85,
      payout_currency: "EUR",
      payout_method: "bank_transfer",
      verifications: ["email", "phone", "government_id"],
      about: "I love welcoming travellers to Morocco!",
      languages_spoken: ["fr", "ar", "en"],
      total_listings: 1,
      member_since: new Date("2022-03-01"),
    },
    created_at: new Date(),
    last_login: new Date(),
  },
  {
    _id: guestId,
    name: "Youssef El Amrani",
    email: "youssef@example.com",
    password_hash: "$2b$10$examplehashguest",
    role: "guest",
    avatar_url: "https://example.com/youssef.jpg",
    phone: "+212600000002",
    is_active: true,
    preferences: {
      language: "ar",
      currency: "MAD",
      timezone: "Africa/Casablanca",
    },
    guest_profile: {
      verified_id: true,
      wishlist_ids: [],
      total_trips: 4,
      is_superguest: false,
    },
    created_at: new Date(),
    last_login: new Date(),
  },
  {
    _id: adminId,
    name: "Admin User",
    email: "admin@airbnb-clone.com",
    password_hash: "$2b$10$examplehashadmin",
    role: "admin",
    is_active: true,
    preferences: {
      language: "en",
      currency: "USD",
      timezone: "UTC",
    },
    admin_profile: {
      permissions: ["manage_users", "manage_listings", "manage_bookings", "view_analytics"],
      department: "Trust & Safety",
    },
    created_at: new Date(),
    last_login: new Date(),
  },
]);

const listingId = new ObjectId();

db.listings.insertOne({
  _id: listingId,
  title: "Cozy Riad in Medina",
  description: "A beautiful traditional Moroccan house in the heart of the old city.",
  property_type: "Entire house",
  room_type: "Entire home/apt",
  cancellation_policy: "moderate",
  accommodates: 4,
  bedrooms: 2,
  beds: 3,
  bathrooms: NumberDecimal("1.0"),
  price_per_night:  NumberDecimal("85.00"),
  security_deposit: NumberDecimal("200.00"),
  cleaning_fee:     NumberDecimal("30.00"),
  extra_people_fee: NumberDecimal("10.00"),
  minimum_nights: 2,
  maximum_nights: 30,
  instant_bookable: false,
  availability: {
    availability_30: 20,
    availability_60: 45,
    availability_90: 70,
    availability_365: 200,
  },
  host: {
    host_id: hostId,
    host_name: "Fatima Zahra",
    host_is_superhost: true,
    host_response_time: "within an hour",
    host_response_rate: 98,
    host_identity_verified: true,
    host_picture_url: "https://example.com/fatima.jpg",
    host_verifications: ["email", "phone", "government_id"],
  },
  location: {
    street: "12 Derb Sidi Ahmed",
    city: "Marrakech",
    country: "Morocco",
    country_code: "MA",
    coordinates: {
      type: "Point",
      coordinates: [-7.9811, 31.6295],
    },
  },
  review_scores: {
    review_scores_accuracy: 10,
    review_scores_cleanliness: 9,
    review_scores_checkin: 10,
    review_scores_communication: 10,
    review_scores_location: 9,
    review_scores_value: 9,
    review_scores_rating: 95,
  },
  amenities: ["WiFi", "Air conditioning", "Kitchen", "Pool", "Washer"],
  photos: ["https://example.com/riad1.jpg"],
  created_at: new Date(),
});

const bookingId = new ObjectId();

db.bookings.insertOne({
  _id: bookingId,
  listing_id: listingId,
  guest_id: guestId,
  check_in: new Date("2026-06-01"),
  check_out: new Date("2026-06-05"),
  status: "confirmed",
  total_price: NumberDecimal("340.00"),
  guests_count: 2,
  special_notes: "We will arrive late around 10pm.",
  created_at: new Date(),
});

db.reviews.insertOne({
  booking_id: bookingId,
  reviewer_id: guestId,
  listing_id: listingId,
  rating: 5,
  comment: "Absolutely stunning place. The host was incredibly welcoming!",
  created_at: new Date(),
});

print("✅ Airbnb DB initialized successfully.");