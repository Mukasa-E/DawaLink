import { Request, Response } from 'express';
import prisma from '../database/db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole, AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone, facility, department, preferredFacility } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['patient', 'healthcare_provider', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await prisma.user.create({
      data: {
        id,
        email,
        name,
        role,
        phone: phone || null,
        facility: facility || null,
        department: department || null,
        preferredFacility: preferredFacility || null,
        passwordHash,
        createdAt: new Date(createdAt),
      },
    });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facility: true, 
        department: true,
        preferredFacility: true,
        createdAt: true 
      },
    });

    if (!user) {
      return res.status(500).json({ message: 'User creation failed' });
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      user,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Return user without password
    const { passwordHash: _ph, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facility: true, 
        department: true,
        preferredFacility: true,
        createdAt: true 
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

