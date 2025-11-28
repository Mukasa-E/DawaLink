import { Request, Response } from 'express';
import prisma from '../database/db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole, AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      name, 
      role, 
      phone, 
      facilityId, 
      specialization, 
      licenseNumber,
      // Facility registration fields
      facilityName,
      facilityType,
      registrationNumber,
      facilityPhone,
      facilityEmail,
      address,
      city,
      county,
      operatingHours,
      services
    } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['patient', 'healthcare_provider', 'facility_admin', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // If facility_admin, validate facility fields
    if (role === 'facility_admin') {
      if (!facilityName || !facilityType || !registrationNumber || !facilityPhone || !facilityEmail || !address || !city) {
        return res.status(400).json({ message: 'Missing required facility fields' });
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and facility in a transaction for facility_admin
    if (role === 'facility_admin') {
      const userId = uuidv4();
      const facilityIdNew = uuidv4();

      // Check if registration number already exists
      const existingFacility = await (prisma as any).facility.findUnique({
        where: { registrationNumber }
      });

      if (existingFacility) {
        return res.status(400).json({ message: 'A facility with this registration number already exists' });
      }

      // Parse services if provided
      const servicesArray = services 
        ? services.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      // Create both user and facility in transaction
      const result = await (prisma as any).$transaction(async (tx: any) => {
        // Create facility first
        const facility = await tx.facility.create({
          data: {
            id: facilityIdNew,
            name: facilityName,
            type: facilityType,
            ownerId: userId,
            registrationNumber,
            phone: facilityPhone,
            email: facilityEmail,
            address,
            city,
            county: county || null,
            operatingHours: operatingHours || null,
            services: servicesArray,
            isVerified: false, // Requires admin verification
          }
        });

        // Create user
        const user = await tx.user.create({
          data: {
            id: userId,
            email,
            name,
            role: 'facility_admin',
            phone: phone || null,
            facilityId: facilityIdNew,
            passwordHash,
          },
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true, 
            phone: true, 
            facilityId: true,
            createdAt: true,
            updatedAt: true
          },
        });

        return { user, facility };
      });

      // Generate token
      const token = generateToken({ 
        userId: result.user.id,
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role as any,
        facilityId: result.user.facilityId || undefined
      });

      return res.status(201).json({
        user: result.user,
        facility: result.facility,
        token,
        message: 'Facility registered successfully. Awaiting admin verification.'
      });
    }

    // Regular user registration (non-facility_admin)
    const id = uuidv4();

    // For healthcare_provider with facilityId, require approval
    const requiresApproval = role === 'healthcare_provider' && facilityId;
    const approvalStatus = requiresApproval ? 'pending' : 'approved';
    const isApproved = !requiresApproval;

    const user = await (prisma.user.create as any)({
      data: {
        id,
        email,
        name,
        role,
        phone: phone || null,
        facilityId: facilityId || null,
        specialization: specialization || null,
        licenseNumber: licenseNumber || null,
        isApproved,
        approvalStatus,
        requestedAt: requiresApproval ? new Date() : null,
        passwordHash,
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facilityId: true, 
        specialization: true,
        licenseNumber: true,
        isApproved: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true
      },
    });

    // Generate token with facilityId
    const token = generateToken({ 
      userId: user.id,
      id: user.id, 
      email: user.email, 
      role: user.role as any,
      facilityId: (user as any).facilityId || undefined
    });

    const message = requiresApproval 
      ? 'Registration successful. Your account is pending approval by the facility administrator.'
      : undefined;

    res.status(201).json({
      user,
      token,
      ...(message && { message })
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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

    // Generate token with facilityId
    const token = generateToken({ 
      userId: user.id,
      id: user.id, 
      email: user.email, 
      role: user.role as any,
      facilityId: (user as any).facilityId || undefined
    });

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

    const user = await (prisma.user.findUnique as any)({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facilityId: true, 
        specialization: true,
        licenseNumber: true,
        isApproved: true,
        approvalStatus: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true
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

