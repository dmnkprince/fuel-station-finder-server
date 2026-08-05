import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows DNS resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback silently
}

dotenv.config();
import pool, { initDB } from '../config/db.js';
import { create as createStation } from '../models/stationModel.js';
import { create as createReport } from '../models/reportModel.js';

const bayelsaStations = [
  {
    name: 'NNPC Mega Station (Ox-Bow Lake / Berger)',
    address: 'Sanni Abacha Expressway, Ox-Bow Lake / Berger Roundabout Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.8981,
    longitude: 6.2946,
    brand: 'NNPC',
    report: { fuel_type: 'PMS', price_per_litre: 1265.0, is_available: true, queue_length: 'Long', upvotes: 24, minutesAgo: 45 },
  },
  {
    name: 'TotalEnergies Service Station',
    address: 'Mbiama-Yenagoa Road, Akumani / Ekeki Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.925,
    longitude: 6.299,
    brand: 'TotalEnergies',
    report: { fuel_type: 'PMS', price_per_litre: 1300.0, is_available: true, queue_length: 'Short', upvotes: 18, minutesAgo: 30 },
  },
  {
    name: 'Rainoil Petrol Station',
    address: 'PDP Junction, Isaac Boro Expressway, Biogbolo Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.931,
    longitude: 6.303,
    brand: 'Rainoil',
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Moderate', upvotes: 15, minutesAgo: 15 },
  },
  {
    name: 'Ardova PLC (AP) Station',
    address: 'Mbiama-Yenagoa Road, Edepie Roundabout Corridor, Yenagoa, Bayelsa State',
    latitude: 4.958,
    longitude: 6.325,
    brand: 'AP',
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 9, minutesAgo: 120 },
  },
  {
    name: 'Conoil Retail Outlet',
    address: 'Mbiama-Yenagoa Road, Opposite DSP Alamieyeseigha Way Junction, Amarata, Yenagoa, Bayelsa State',
    latitude: 4.935,
    longitude: 6.287,
    brand: 'Conoil',
    report: { fuel_type: 'PMS', price_per_litre: 1290.0, is_available: true, queue_length: 'Short', upvotes: 11, minutesAgo: 480 },
  },
  {
    name: 'Matrix Energy Fuel Station',
    address: 'Isaac Boro Expressway, Okutukutu / Etegwe Axis, Yenagoa, Bayelsa State',
    latitude: 4.951,
    longitude: 6.319,
    brand: 'Matrix',
    report: { fuel_type: 'PMS', price_per_litre: 1310.0, is_available: true, queue_length: 'None', upvotes: 13, minutesAgo: 10 },
  },
  {
    name: 'BOVAS & Company Retail Station',
    address: 'East-West Road Interchange, Sagbama Junction, Bayelsa State',
    latitude: 5.148,
    longitude: 6.215,
    brand: 'BOVAS',
    report: { fuel_type: 'PMS', price_per_litre: 1280.0, is_available: true, queue_length: 'None', upvotes: 7, minutesAgo: 20 },
  },
  {
    name: 'Kobison Oil & Gas Ltd',
    address: 'Isaac Adaka Boro Expressway, Central Yenagoa Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.938,
    longitude: 6.291,
    brand: 'Kobison',
    report: { fuel_type: 'PMS', price_per_litre: 1330.0, is_available: true, queue_length: 'Long', upvotes: 21, minutesAgo: 60 },
  },
  {
    name: 'Paulo Marine & Oil Nigeria Limited',
    address: 'Shell Ramp, Swali Market Road, Swali, Yenagoa 569101, Bayelsa State',
    latitude: 4.9038,
    longitude: 6.2725,
    brand: 'Paulo Marine',
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 16, minutesAgo: 90 },
  },
  {
    name: 'Sobaz Petroleum Ltd (Sobaz Nig. Ltd.)',
    address: 'Mbiama-Yenagoa Road, Opposite Ekeki Motor Park, Okaka / Ekeki Axis, Yenagoa 569101, Bayelsa State',
    latitude: 4.922,
    longitude: 6.297,
    brand: 'Sobaz',
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Short', upvotes: 8, minutesAgo: 600 },
  },
  {
    name: 'Tonimas Filling Station',
    address: 'Mbiama-Yenagoa Road, Edepie Corridor, Yenagoa 569101, Bayelsa State',
    latitude: 4.96,
    longitude: 6.328,
    brand: 'Tonimas',
    report: { fuel_type: 'PMS', price_per_litre: 0.0, is_available: false, queue_length: 'None', upvotes: 14, minutesAgo: 180 },
  },
  {
    name: 'NIPCO Partner Station',
    address: 'Tombia-Etegwe Roundabout, Mbiama-Yenagoa Road, Yenagoa, Bayelsa State',
    latitude: 4.968,
    longitude: 6.331,
    brand: 'NIPCO',
    report: { fuel_type: 'PMS', price_per_litre: 1315.0, is_available: true, queue_length: 'Short', upvotes: 10, minutesAgo: 50 },
  },
  {
    name: 'Azikel Petroleum / Refinery Station',
    address: 'East-West Road Bypass, Obunagha / Polaku Interchange, Yenagoa 569101, Bayelsa State',
    latitude: 5.011,
    longitude: 6.368,
    brand: 'Azikel',
    report: { fuel_type: 'PMS', price_per_litre: 1290.0, is_available: true, queue_length: 'None', upvotes: 19, minutesAgo: 720 },
  },
  {
    name: 'GEC Petroleum Outlet',
    address: 'Isaac Boro Expressway, Near INEC Junction, Kpansia, Yenagoa, Bayelsa State',
    latitude: 4.933,
    longitude: 6.307,
    brand: 'GEC',
    report: { fuel_type: 'PMS', price_per_litre: 1320.0, is_available: true, queue_length: 'Moderate', upvotes: 6, minutesAgo: 40 },
  },
  {
    name: 'Zarama Transit Fuel Station',
    address: 'East-West Highway, Zarama Market Junction, Kolokuma/Opokuma LGA, Bayelsa Corridor, Bayelsa State',
    latitude: 5.065,
    longitude: 6.425,
    brand: 'Zarama',
    report: { fuel_type: 'PMS', price_per_litre: 1335.0, is_available: true, queue_length: 'None', upvotes: 12, minutesAgo: 15 },
  },
];

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: Please configure a valid DATABASE_URL in your .env file before running seed.');
    process.exit(1);
  }

  try {
    console.log('Initializing PostgreSQL database schema...');
    await initDB();

    console.log('Clearing old stations and reports...');
    await pool.query('TRUNCATE TABLE reports, stations RESTART IDENTITY CASCADE;');

    console.log('Seeding 15 Bayelsa State filling stations into PostgreSQL...');

    for (const item of bayelsaStations) {
      const station = await createStation({
        name: item.name,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        brand: item.brand,
      });

      const createdAt = new Date(Date.now() - item.report.minutesAgo * 60 * 1000);

      const report = await createReport({
        station_id: station.id,
        fuel_type: item.report.fuel_type,
        price_per_litre: item.report.price_per_litre,
        is_available: item.report.is_available,
        queue_length: item.report.queue_length,
      });

      // Update upvotes and created_at for historical timestamp accuracy
      await pool.query(
        'UPDATE reports SET upvotes = $1, created_at = $2 WHERE id = $3',
        [item.report.upvotes, createdAt, report.id]
      );

      console.log(`Seeded station: ${station.name}`);
    }

    console.log('\nAll 15 Bayelsa filling stations seeded successfully into PostgreSQL / Supabase!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding PostgreSQL database:', err);
    process.exit(1);
  }
}

seedDatabase();
