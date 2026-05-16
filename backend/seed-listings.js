// seed-listings.js
// Exécuter : node seed-listings.js
// Depuis    : airbnb-clone/backend/

const mongoose = require("mongoose");
require("dotenv").config();

// ✅ Vérifie que ce MONGO_URI correspond à ton .env
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://airbnb_app:apppassword123@localhost:27017/airbnb";

// strict: false → bypass Mongoose, envoie directement à MongoDB
const listingSchema = new mongoose.Schema({}, { strict: false });
const Listing = mongoose.model("Listing", listingSchema, "listings");

// ✅ Crée un Decimal128 comme attendu par MongoDB
const dec = (n) => mongoose.Types.Decimal128.fromString(String(n));

const makeHost = (name, superhost, pictureUrl) => ({
  host_id: new mongoose.Types.ObjectId(),
  host_name: name,
  host_is_superhost: superhost,
  host_response_time: "within an hour",
  host_response_rate: 95,
  host_identity_verified: true,
  host_picture_url: pictureUrl,
});

const listings = [
  {
    title: "Cozy Riad in Marrakech Medina",
    description: "Maison traditionnelle marocaine au coeur de la medina avec terrasse sur les toits.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "moderate",
    accommodates: 4, bedrooms: 2, beds: 3,
    bathrooms: dec(1.0), price_per_night: dec(85.00), security_deposit: dec(200.00), cleaning_fee: dec(30.00),
    minimum_nights: 2, maximum_nights: 30, instant_bookable: false, is_active: true,
    host: makeHost("Fatima Zahra", true, "https://randomuser.me/api/portraits/women/44.jpg"),
    location: {
      street: "12 Derb Sidi Ahmed", city: "Marrakech", country: "Morocco", country_code: "MA",
      coordinates: { type: "Point", coordinates: [-7.9811, 31.6295] },
    },
    amenities: ["WiFi", "Air conditioning", "Kitchen", "Pool", "Washer"],
    photos: [
      "https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1531088009183-5ff5b7c95f91?w=800",
    ],
    labels: ["trending", "mansions"], created_at: new Date(),
  },
  {
    title: "Luxury Villa with Ocean View",
    description: "Superbe villa avec piscine a debordement et vue panoramique sur l'ocean.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "strict",
    accommodates: 8, bedrooms: 4, beds: 5,
    bathrooms: dec(3.0), price_per_night: dec(350.00), security_deposit: dec(1000.00), cleaning_fee: dec(80.00),
    minimum_nights: 3, maximum_nights: 14, instant_bookable: true, is_active: true,
    host: makeHost("Carlos Mendez", true, "https://randomuser.me/api/portraits/men/32.jpg"),
    location: {
      street: "Camino del Mar 45", city: "Marbella", country: "Spain", country_code: "ES",
      coordinates: { type: "Point", coordinates: [-4.8861, 36.5097] },
    },
    amenities: ["WiFi", "Pool", "Air conditioning", "Kitchen", "Parking", "Gym", "BBQ"],
    photos: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    ],
    labels: ["Amazing views", "luxe", "mansions"], created_at: new Date(),
  },
  {
    title: "Charming Parisian Apartment",
    description: "Appartement elegant a deux pas de la Tour Eiffel.",
    property_type: "Entire apartment", room_type: "Entire home/apt", cancellation_policy: "flexible",
    accommodates: 3, bedrooms: 1, beds: 2,
    bathrooms: dec(1.0), price_per_night: dec(120.00), security_deposit: dec(300.00), cleaning_fee: dec(40.00),
    minimum_nights: 2, maximum_nights: 30, instant_bookable: true, is_active: true,
    host: makeHost("Sophie Martin", true, "https://randomuser.me/api/portraits/women/22.jpg"),
    location: {
      street: "15 Rue de la Paix", city: "Paris", country: "France", country_code: "FR",
      coordinates: { type: "Point", coordinates: [2.3308, 48.8698] },
    },
    amenities: ["WiFi", "Kitchen", "Washer", "Elevator", "Heating"],
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    ],
    labels: ["trending", "Amazing views"], created_at: new Date(),
  },
  {
    title: "Beachfront Bungalow in Bali",
    description: "Reveillez-vous au son des vagues dans ce bungalow en bord de mer.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "moderate",
    accommodates: 2, bedrooms: 1, beds: 1,
    bathrooms: dec(1.0), price_per_night: dec(95.00), security_deposit: dec(150.00), cleaning_fee: dec(25.00),
    minimum_nights: 3, maximum_nights: 21, instant_bookable: false, is_active: true,
    host: makeHost("Wayan Putra", true, "https://randomuser.me/api/portraits/men/55.jpg"),
    location: {
      street: "Jl. Pantai Seminyak", city: "Bali", country: "Indonesia", country_code: "ID",
      coordinates: { type: "Point", coordinates: [115.1449, -8.6906] },
    },
    amenities: ["WiFi", "Pool", "Air conditioning", "Kitchen", "Breakfast"],
    photos: [
      "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800",
      "https://images.unsplash.com/photo-1544550285-f813152fb2fd?w=800",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    ],
    labels: ["trending", "Surfing", "Amazing views", "Beach"], created_at: new Date(),
  },
  {
    title: "Scottish Highlands Castle",
    description: "Vivez comme des rois dans ce chateau du 18e siecle avec vue sur les montagnes.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "strict",
    accommodates: 12, bedrooms: 6, beds: 8,
    bathrooms: dec(4.0), price_per_night: dec(680.00), security_deposit: dec(2000.00), cleaning_fee: dec(150.00),
    minimum_nights: 3, maximum_nights: 14, instant_bookable: false, is_active: true,
    host: makeHost("Angus MacGregor", false, "https://randomuser.me/api/portraits/men/67.jpg"),
    location: {
      street: "Loch Ness Road", city: "Inverness", country: "United Kingdom", country_code: "GB",
      coordinates: { type: "Point", coordinates: [-4.2247, 57.4778] },
    },
    amenities: ["WiFi", "Fireplace", "Kitchen", "Parking", "Hot tub", "Pets allowed"],
    photos: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1595521624167-83d90e934c9d?w=800",
      "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800",
    ],
    labels: ["Castles", "Amazing views", "mansions"], created_at: new Date(),
  },
  {
    title: "Lakefront Cabin in Canada",
    description: "Chalet en rondins directement sur un lac. Kayaks et canoes inclus.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "moderate",
    accommodates: 6, bedrooms: 3, beds: 4,
    bathrooms: dec(2.0), price_per_night: dec(185.00), security_deposit: dec(400.00), cleaning_fee: dec(60.00),
    minimum_nights: 2, maximum_nights: 21, instant_bookable: true, is_active: true,
    host: makeHost("Emma Thompson", true, "https://randomuser.me/api/portraits/women/68.jpg"),
    location: {
      street: "123 Lakeview Drive", city: "Muskoka", country: "Canada", country_code: "CA",
      coordinates: { type: "Point", coordinates: [-79.3832, 45.0000] },
    },
    amenities: ["WiFi", "Fireplace", "Kitchen", "BBQ", "Kayak", "Fishing gear", "Pets allowed"],
    photos: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800",
      "https://images.unsplash.com/photo-1475855581690-80accde3ae2b?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    ],
    labels: ["Lakefront", "Amazing views"], created_at: new Date(),
  },
  {
    title: "Tiny House in the Forest",
    description: "Petite maison unique nichee dans une foret ancienne. Energie solaire.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "flexible",
    accommodates: 2, bedrooms: 1, beds: 1,
    bathrooms: dec(1.0), price_per_night: dec(75.00), security_deposit: dec(100.00), cleaning_fee: dec(20.00),
    minimum_nights: 1, maximum_nights: 7, instant_bookable: true, is_active: true,
    host: makeHost("Lily Chen", false, "https://randomuser.me/api/portraits/women/88.jpg"),
    location: {
      street: "Forest Trail Rd", city: "Portland", country: "United States", country_code: "US",
      coordinates: { type: "Point", coordinates: [-122.6765, 45.5231] },
    },
    amenities: ["WiFi", "Kitchen", "Fireplace", "Hiking trails"],
    photos: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
      "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
    ],
    labels: ["Tiny homes", "Amazing views"], created_at: new Date(),
  },
  {
    title: "Private Island Retreat Maldives",
    description: "Votre propre ile privee. Acces uniquement en bateau, isolement total.",
    property_type: "Entire house", room_type: "Entire home/apt", cancellation_policy: "super_strict",
    accommodates: 6, bedrooms: 3, beds: 4,
    bathrooms: dec(2.0), price_per_night: dec(1200.00), security_deposit: dec(5000.00), cleaning_fee: dec(200.00),
    minimum_nights: 5, maximum_nights: 14, instant_bookable: false, is_active: true,
    host: makeHost("Rafael Santos", true, "https://randomuser.me/api/portraits/men/41.jpg"),
    location: {
      street: "Private Island", city: "Maldives", country: "Maldives", country_code: "MV",
      coordinates: { type: "Point", coordinates: [73.5093, 1.9770] },
    },
    amenities: ["WiFi", "Pool", "Air conditioning", "Kitchen", "Boat", "Snorkeling gear", "Chef"],
    photos: [
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800",
      "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800",
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800",
    ],
    labels: ["Islands", "Amazing views", "luxe"], created_at: new Date(),
  },
  {
    title: "Houseboat on Amsterdam Canal",
    description: "Vivez Amsterdam comme un local sur ce superbe bateau-maison.",
    property_type: "Entire apartment", room_type: "Entire home/apt", cancellation_policy: "moderate",
    accommodates: 4, bedrooms: 2, beds: 2,
    bathrooms: dec(1.0), price_per_night: dec(145.00), security_deposit: dec(300.00), cleaning_fee: dec(50.00),
    minimum_nights: 2, maximum_nights: 14, instant_bookable: true, is_active: true,
    host: makeHost("Jan van der Berg", true, "https://randomuser.me/api/portraits/men/28.jpg"),
    location: {
      street: "Prinsengracht 421", city: "Amsterdam", country: "Netherlands", country_code: "NL",
      coordinates: { type: "Point", coordinates: [4.8897, 52.3676] },
    },
    amenities: ["WiFi", "Kitchen", "Washer", "Bikes", "Heating"],
    photos: [
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
    labels: ["Boats", "trending"], created_at: new Date(),
  },
  {
    title: "Golf Resort Suite Dubai",
    description: "Suite 5 etoiles vue parcours de golf, service de majordome inclus.",
    property_type: "Hotel room", room_type: "Hotel room", cancellation_policy: "strict",
    accommodates: 2, bedrooms: 1, beds: 1,
    bathrooms: dec(1.0), price_per_night: dec(420.00), security_deposit: dec(500.00), cleaning_fee: dec(0.00),
    minimum_nights: 1, maximum_nights: 30, instant_bookable: true, is_active: true,
    host: makeHost("Ahmed Al Rashid", true, "https://randomuser.me/api/portraits/men/77.jpg"),
    location: {
      street: "Emirates Hills Boulevard", city: "Dubai", country: "United Arab Emirates", country_code: "AE",
      coordinates: { type: "Point", coordinates: [55.1562, 25.0657] },
    },
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Butler", "Parking"],
    photos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
    ],
    labels: ["Golfing", "luxe", "Amazing views"], created_at: new Date(),
  },
  {
    title: "Surfside Studio in Lisbon",
    description: "Studio moderne a quelques minutes des meilleurs spots de surf.",
    property_type: "Entire apartment", room_type: "Entire home/apt", cancellation_policy: "flexible",
    accommodates: 2, bedrooms: 1, beds: 1,
    bathrooms: dec(1.0), price_per_night: dec(65.00), security_deposit: dec(100.00), cleaning_fee: dec(20.00),
    minimum_nights: 1, maximum_nights: 30, instant_bookable: true, is_active: true,
    host: makeHost("Pedro Alves", false, "https://randomuser.me/api/portraits/men/18.jpg"),
    location: {
      street: "Rua do Surf 7", city: "Lisbon", country: "Portugal", country_code: "PT",
      coordinates: { type: "Point", coordinates: [-9.1393, 38.7223] },
    },
    amenities: ["WiFi", "Kitchen", "Surfboard storage", "Outdoor shower", "Bikes"],
    photos: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    ],
    labels: ["Surfing", "trending", "Beach"], created_at: new Date(),
  },
  {
    title: "Creative Loft in Brooklyn",
    description: "Loft artistique dans un entrepot converti, plafonds de 5m et vue sur Manhattan.",
    property_type: "Entire loft", room_type: "Entire home/apt", cancellation_policy: "moderate",
    accommodates: 4, bedrooms: 1, beds: 2,
    bathrooms: dec(1.0), price_per_night: dec(160.00), security_deposit: dec(300.00), cleaning_fee: dec(45.00),
    minimum_nights: 2, maximum_nights: 30, instant_bookable: true, is_active: true,
    host: makeHost("Zoe Williams", true, "https://randomuser.me/api/portraits/women/12.jpg"),
    location: {
      street: "145 Bedford Ave", city: "New York", country: "United States", country_code: "US",
      coordinates: { type: "Point", coordinates: [-73.9566, 40.7170] },
    },
    amenities: ["WiFi", "Kitchen", "Washer", "Dryer", "Gym access", "Rooftop"],
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    ],
    labels: ["Creative spaces", "trending"], created_at: new Date(),
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connecte a MongoDB");

    const existing = await Listing.countDocuments();
    console.log(`📦 Listings existants : ${existing}`);

    // ✅ Evite les doublons si le script est relance plusieurs fois
    if (existing >= listings.length) {
      console.log("⚠️  Listings deja inseres. Supprime-les d'abord si tu veux re-seeder.");
      await mongoose.disconnect();
      return;
    }

    const result = await Listing.insertMany(listings, { ordered: false });
    console.log(`🎉 ${result.length} listings inseres avec succes !`);

  } catch (err) {
    if (err.insertedDocs && err.insertedDocs.length > 0) {
      console.log(`⚠️  ${err.insertedDocs.length} inseres, certains ont echoue.`);
    }
    console.error("❌ Erreur : " + err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Deconnecte.");
  }
}

seed();