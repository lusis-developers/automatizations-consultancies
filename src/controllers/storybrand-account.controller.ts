import type { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import { StorybrandService } from '../services/storybrand.service';
import CustomError from '../errors/customError.error';
import { Types } from 'mongoose';

const storybrandService = new StorybrandService();

/**
 * @description Creates a new StoryBrand account
 * @route POST /api/storybrand-account
 */
export async function createStorybrandAccountController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, firstName, lastName, clientId } = req.body;

    // 1. Basic input validation
    if (!email || !password || password.length < 6 || !clientId) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Email and password are required. Password must be at least 6 characters long. ClientId is required.' 
      });
      return;
    }
    
    // Use default values if firstName or lastName are not provided
    const userFirstName = firstName || email.split('@')[0];
    const userLastName = lastName || '';

    // 2. Check if account already exists for this client
    const accountExists = await storybrandService.checkExistingAccount(clientId);
    if (accountExists) {
      res.status(HttpStatusCode.Conflict).send({ 
        message: 'This client already has a StoryBrand account' 
      });
      return;
    }

    // 3. Create account using the service
    const newAccount = await storybrandService.createAccount(clientId, {
      email,
      password,
      firstName: userFirstName,
      lastName: userLastName
    });

    // 4. Prepare response to client
    // For security, we don't return sensitive data
    const accountResponse = {
      _id: newAccount._id,
      client: newAccount.client,
      mvpType: newAccount.mvpType,
      active: newAccount.active,
      createdAt: newAccount.createdAt
    };

    res.status(HttpStatusCode.Created).send({
      message: 'StoryBrand account created successfully',
      account: accountResponse
    });
    return;

  } catch (error: unknown) {
    if (error instanceof CustomError) {
      res.status(error.status).send({
        success: false,
        message: error.message
      });
      return;
    }
    
    console.error('Error creating StoryBrand account:', error);
    next(error);
  }
}

/**
 * @description Admin endpoint to change a StoryBrand account's password
 * @route PUT /api/storybrand-account/password
 */
export async function adminChangePasswordController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId, newPassword } = req.body;

    // 1. Basic input validation
    if (!clientId || !newPassword || newPassword.length < 6) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Client ID and new password are required. New password must be at least 6 characters long' 
      });
      return;
    }

    // Validate clientId format
    if (!Types.ObjectId.isValid(clientId)) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Invalid client ID format' 
      });
      return;
    }

    // 2. Change password using the service
    await storybrandService.changePassword(clientId, newPassword);

    res.status(HttpStatusCode.Ok).send({
      message: 'Password changed successfully'
    });
    return;

  } catch (error: unknown) {
    if (error instanceof CustomError) {
      res.status(error.status).send({
        success: false,
        message: error.message
      });
      return;
    }
    
    console.error('Error changing StoryBrand account password:', error);
    next(error);
  }
}

/**
 * @description Admin endpoint to delete a StoryBrand account
 * @route DELETE /api/storybrand-account/:userId
 */
export async function adminDeleteUserAccountController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    // 1. Basic input validation
    if (!userId) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Client ID is required' 
      });
      return;
    }

    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Invalid client ID format' 
      });
      return;
    }

    // 2. Delete account using the service
    await storybrandService.deleteAccount(userId);

    res.status(HttpStatusCode.Ok).send({
      message: 'StoryBrand account and all associated data deleted successfully'
    });
    return;

  } catch (error: unknown) {
    if (error instanceof CustomError) {
      res.status(error.status).send({
        success: false,
        message: error.message
      });
      return;
    }
    
    console.error('Error deleting StoryBrand account:', error);
    next(error);
  }
}

/**
 * @description Gets all MVP accounts associated with a specific client
 * @route GET /api/storybrand-account/client/:clientId
 */
export async function getClientMvpAccountsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId } = req.params;

    // 1. Basic input validation
    if (!clientId) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Client ID is required' 
      });
      return;
    }

    // Validate clientId format
    if (!Types.ObjectId.isValid(clientId)) {
      res.status(HttpStatusCode.BadRequest).send({ 
        message: 'Invalid client ID format' 
      });
      return;
    }

    // 2. Get accounts using the service
    const accounts = await storybrandService.getAccountsByClientId(clientId);

    res.status(HttpStatusCode.Ok).send({
      message: 'MVP accounts retrieved successfully',
      accounts
    });
    return;

  } catch (error: unknown) {
    if (error instanceof CustomError) {
      res.status(error.status).send({
        success: false,
        message: error.message
      });
      return;
    }
    
    console.error('Error retrieving MVP accounts:', error);
    next(error);
  }
}