import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/userModel.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

const VALID_ROLES = ['admin', 'station_manager', 'user'];

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  const assignedRole = 'user';

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({ name, email, password_hash, role: assignedRole });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, station_id: user.station_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, station_id: user.station_id, created_at: user.created_at },
        token,
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, station_id: user.station_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, station_id: user.station_id, created_at: user.created_at },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve user.' });
  }
}

/**
 * POST /api/auth/create-manager  (Admin only)
 * Creates a new station manager account.
 */
export async function createManager(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({ name, email, password_hash, role: 'station_manager' });

    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
    });
  } catch (err) {
    console.error('Create manager error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create station manager.' });
  }
}

/**
 * GET /api/auth/managers  (Admin only)
 * Returns all station manager accounts.
 */
export async function getManagers(req, res) {
  try {
    const managers = await UserModel.findAllManagers();
    res.json({ success: true, data: managers });
  } catch (err) {
    console.error('Get managers error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve managers.' });
  }
}

/**
 * GET /api/auth/my-stations
 * Returns all stations assigned to the currently authenticated manager.
 */
export async function getMyStations(req, res) {
  try {
    const { getStationsByManager } = await import('../models/stationModel.js');
    const stations = await getStationsByManager(req.user.id);
    res.json({ success: true, data: stations });
  } catch (err) {
    console.error('Get my stations error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve assigned stations.' });
  }
}

/**
 * GET /api/auth/managers/:id  (Admin only)
 * Returns details of a specific station manager including their assigned stations.
 */
export async function getManagerDetails(req, res) {
  const { id } = req.params;
  try {
    const manager = await UserModel.findById(id);
    if (!manager || manager.role !== 'station_manager') {
      return res.status(404).json({ success: false, message: 'Station manager not found.' });
    }
    const { getStationsByManager } = await import('../models/stationModel.js');
    const stations = await getStationsByManager(id);
    res.json({ success: true, data: { ...manager, stations } });
  } catch (err) {
    console.error('Get manager details error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve manager details.' });
  }
}

/**
 * PUT /api/auth/managers/:id  (Admin only)
 * Updates details of a station manager (name, email, optional password).
 */
export async function updateManager(req, res) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  try {
    const manager = await UserModel.findById(id);
    if (!manager || manager.role !== 'station_manager') {
      return res.status(404).json({ success: false, message: 'Station manager not found.' });
    }

    // Check email uniqueness if email changed
    if (email !== manager.email) {
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    let password_hash = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    }

    const updated = await UserModel.update(id, { name, email, password_hash });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update manager error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update manager.' });
  }
}

/**
 * DELETE /api/auth/managers/:id/stations/:stationId  (Admin only)
 * Unassigns a station from a manager.
 */
export async function unassignStation(req, res) {
  const { id, stationId } = req.params;
  try {
    const { removeManager } = await import('../models/stationModel.js');
    const removed = await removeManager(stationId, id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    res.json({ success: true, message: 'Station unassigned successfully.' });
  } catch (err) {
    console.error('Unassign station error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to unassign station.' });
  }
}

