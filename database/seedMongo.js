import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Station from '../models/stationModel.js';
import Report from '../models/reportModel.js';

// Fix for Windows / local router SRV DNS resolution failure (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback silently
}

dotenv.config();

const sampleStations = [
  {
    name: 'NNPC Plaza',
    address: 'Herbert Macaulay Way, Central Business District, Abuja',
    latitude: 9.0645,
    longitude: 7.4875,
    brand: 'NNPC',
    report: { fuel_type: 'PMS', price_per_litre: 650.0, is_available: true, queue_length: 'Short', upvotes: 5, minutesAgo: 30 },
  },
  {
    name: 'TotalEnergies - Victoria Island',
    address: 'Adetokunbo Ademola St, Victoria Island, Lagos',
    latitude: 6.4281,
    longitude: 3.4219,
    brand: 'TotalEnergies',
    report: { fuel_type: 'PMS', price_per_litre: 620.0, is_available: true, queue_length: 'Moderate', upvotes: 12, minutesAgo: 60 },
  },
  {
    name: 'Mobil - Lekki Phase 1',
    address: 'Lekki-Epe Expressway, Lekki, Lagos',
    latitude: 6.4369,
    longitude: 3.4612,
    brand: 'Mobil',
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 8, minutesAgo: 15 },
  },
  {
    name: 'Ardova PLC (AP) - Ikeja',
    address: 'Obafemi Awolowo Way, Ikeja, Lagos',
    latitude: 6.5967,
    longitude: 3.3421,
    brand: 'AP',
    report: { fuel_type: 'PMS', price_per_litre: 615.0, is_available: true, queue_length: 'Long', upvotes: 20, minutesAgo: 45 },
  },
  {
    name: 'Enyo Retail - Port Harcourt',
    address: 'Aba Road, Port Harcourt',
    latitude: 4.8156,
    longitude: 7.0124,
    brand: 'Enyo',
    report: { fuel_type: 'PMS', price_per_litre: 670.0, is_available: true, queue_length: 'None', upvotes: 2, minutesAgo: 180 },
  },
  {
    name: 'Conoil - Wuse Zone 6',
    address: 'Herbert Macaulay Way, Wuse, Abuja',
    latitude: 9.0682,
    longitude: 7.4641,
    brand: 'Conoil',
    report: { fuel_type: 'PMS', price_per_litre: 645.0, is_available: true, queue_length: 'Short', upvotes: 1, minutesAgo: 840 },
  },
];

async function seedDatabase() {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
    console.error('ERROR: Please configure a valid MONGODB_URI in your .env file before running seed.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected! Clearing existing stations and reports...');

    await Station.deleteMany({});
    await Report.deleteMany({});

    for (const item of sampleStations) {
      const station = await Station.create({
        name: item.name,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        brand: item.brand,
      });

      const createdAt = new Date(Date.now() - item.report.minutesAgo * 60 * 1000);

      await Report.create({
        station_id: station._id,
        fuel_type: item.report.fuel_type,
        price_per_litre: item.report.price_per_litre,
        is_available: item.report.is_available,
        queue_length: item.report.queue_length,
        upvotes: item.report.upvotes,
        created_at: createdAt,
      });

      console.log(`Seeded station: ${station.name}`);
    }

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
