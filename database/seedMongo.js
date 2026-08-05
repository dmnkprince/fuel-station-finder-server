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

const bayelsaStations = [
  {
    name: 'NNPC Mega Station (Ox-Bow Lake / Berger)',
    address: 'Sanni Abacha Expressway, Ox-Bow Lake / Berger Roundabout Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.8981,
    longitude: 6.2946,
    brand: 'NNPC',
    // Status: Yellow (Queue) - available, long queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1265.0, is_available: true, queue_length: 'Long', upvotes: 24, minutesAgo: 45 },
  },
  {
    name: 'TotalEnergies Service Station',
    address: 'Mbiama-Yenagoa Road, Akumani / Ekeki Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.925,
    longitude: 6.299,
    brand: 'TotalEnergies',
    // Status: Green (In Stock) - available, short queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1300.0, is_available: true, queue_length: 'Short', upvotes: 18, minutesAgo: 30 },
  },
  {
    name: 'Rainoil Petrol Station',
    address: 'PDP Junction, Isaac Boro Expressway, Biogbolo Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.931,
    longitude: 6.303,
    brand: 'Rainoil',
    // Status: Yellow (Queue) - available, moderate queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Moderate', upvotes: 15, minutesAgo: 15 },
  },
  {
    name: 'Ardova PLC (AP) Station',
    address: 'Mbiama-Yenagoa Road, Edepie Roundabout Corridor, Yenagoa, Bayelsa State',
    latitude: 4.958,
    longitude: 6.325,
    brand: 'AP',
    // Status: Red (No Stock) - not available, < 6 hours
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 9, minutesAgo: 120 },
  },
  {
    name: 'Conoil Retail Outlet',
    address: 'Mbiama-Yenagoa Road, Opposite DSP Alamieyeseigha Way Junction, Amarata, Yenagoa, Bayelsa State',
    latitude: 4.935,
    longitude: 6.287,
    brand: 'Conoil',
    // Status: Grey (Stale) - updated 8 hours ago (> 6 hours)
    report: { fuel_type: 'PMS', price_per_litre: 1290.0, is_available: true, queue_length: 'Short', upvotes: 11, minutesAgo: 480 },
  },
  {
    name: 'Matrix Energy Fuel Station',
    address: 'Isaac Boro Expressway, Okutukutu / Etegwe Axis, Yenagoa, Bayelsa State',
    latitude: 4.951,
    longitude: 6.319,
    brand: 'Matrix',
    // Status: Green (In Stock) - available, no queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1310.0, is_available: true, queue_length: 'None', upvotes: 13, minutesAgo: 10 },
  },
  {
    name: 'BOVAS & Company Retail Station',
    address: 'East-West Road Interchange, Sagbama Junction, Bayelsa State',
    latitude: 5.148,
    longitude: 6.215,
    brand: 'BOVAS',
    // Status: Green (In Stock) - available, no queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1280.0, is_available: true, queue_length: 'None', upvotes: 7, minutesAgo: 20 },
  },
  {
    name: 'Kobison Oil & Gas Ltd',
    address: 'Isaac Adaka Boro Expressway, Central Yenagoa Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.938,
    longitude: 6.291,
    brand: 'Kobison',
    // Status: Yellow (Queue) - available, long queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1330.0, is_available: true, queue_length: 'Long', upvotes: 21, minutesAgo: 60 },
  },
  {
    name: 'Paulo Marine & Oil Nigeria Limited',
    address: 'Shell Ramp, Swali Market Road, Swali, Yenagoa 569101, Bayelsa State',
    latitude: 4.9038,
    longitude: 6.2725,
    brand: 'Paulo Marine',
    // Status: Red (No Stock) - not available, < 6 hours
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 16, minutesAgo: 90 },
  },
  {
    name: 'Sobaz Petroleum Ltd (Sobaz Nig. Ltd.)',
    address: 'Mbiama-Yenagoa Road, Opposite Ekeki Motor Park, Okaka / Ekeki Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.922,
    longitude: 6.297,
    brand: 'Sobaz',
    // Status: Grey (Stale) - updated 10 hours ago (> 6 hours)
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Short', upvotes: 8, minutesAgo: 600 },
  },
  {
    name: 'Tonimas Filling Station',
    address: 'Mbiama-Yenagoa Road, Edepie Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.96,
    longitude: 6.328,
    brand: 'Tonimas',
    // Status: Red (No Stock) - not available, < 6 hours
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 14, minutesAgo: 180 },
  },
  {
    name: 'NIPCO Partner Station',
    address: 'Tombia-Etegwe Roundabout, Mbiama-Yenagoa Road, Yenagoa, Bayelsa State',
    latitude: 4.968,
    longitude: 6.331,
    brand: 'NIPCO',
    // Status: Green (In Stock) - available, short queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1315.0, is_available: true, queue_length: 'Short', upvotes: 10, minutesAgo: 50 },
  },
  {
    name: 'Azikel Petroleum / Refinery Station',
    address: 'East-West Road Bypass, Obunagha / Polaku Interchange, Yenagoa 569101, Bayelsa State',
    latitude: 5.011,
    longitude: 6.368,
    brand: 'Azikel',
    // Status: Grey (Stale) - updated 12 hours ago (> 6 hours)
    report: { fuel_type: 'PMS', price_per_litre: 1290.0, is_available: true, queue_length: 'None', upvotes: 19, minutesAgo: 720 },
  },
  {
    name: 'GEC Petroleum Outlet',
    address: 'Isaac Boro Expressway, Near INEC Junction, Kpansia, Yenagoa, Bayelsa State',
    latitude: 4.933,
    longitude: 6.307,
    brand: 'GEC',
    // Status: Yellow (Queue) - available, moderate queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Moderate', upvotes: 6, minutesAgo: 40 },
  },
  {
    name: 'Zarama Transit Fuel Station',
    address: 'East-West Highway, Zarama Market Junction, Kolokuma/Opokuma LGA, Bayelsa Corridor, Bayelsa State',
    latitude: 5.065,
    longitude: 6.425,
    brand: 'Zarama',
    // Status: Green (In Stock) - available, no queue, < 2 hours
    report: { fuel_type: 'PMS', price_per_litre: 1335.0, is_available: true, queue_length: 'None', upvotes: 12, minutesAgo: 15 },
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
    console.log('Connected! Seeding 15 distributed Bayelsa State filling stations...');

    await Station.deleteMany({});
    await Report.deleteMany({});

    for (const item of bayelsaStations) {
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

    console.log('\nAll 15 Bayelsa filling stations seeded successfully into MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
