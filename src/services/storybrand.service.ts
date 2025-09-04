import axios, { HttpStatusCode } from "axios";
import { Types } from "mongoose";
import models from "../models";
import CustomError from "../errors/customError.error";

export class StorybrandService {
  private baseUrl: string;
  private mvpType: string = "storybrand";

  constructor() {
    // Use VITE_URL_STORYBRAND environment variable or default to localhost:8101
    this.baseUrl = process.env.VITE_URL_STORYBRAND || "http://localhost:8101";
  }

  /**
   * Verifies if a StoryBrand account already exists for the specified client
   * @param clientId Client ID
   * @returns true if exists, false if not
   */
  public async checkExistingAccount(clientId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new CustomError(
        "Invalid client ID format",
        HttpStatusCode.BadRequest
      );
    }

    try {
      // Search in the generic mvpAccounts model
      const existingAccount = await models.mvpAccounts.findOne({
        client: clientId,
        mvpType: this.mvpType
      });

      return !!existingAccount;
    } catch (error: unknown) {
      console.error('Error checking existing account:', error);
      return false; // Assume no account exists if there's an error
    }
  }

  /**
   * Creates an account in the external StoryBrand service
   * @param accountData Account data to create (email, password, firstName, lastName)
   * @returns The account created in the external service
   * @note The password is sent without hashing, allowing the external service to handle its own password security
   */
  private async createExternalAccount(accountData: Record<string, any>) {
    try {
      // Make the call to the external StoryBrand API
      // Using the correct endpoint /storybrand-account instead of /accounts
      const response = await axios.post(`${this.baseUrl}/api/storybrand-account`, accountData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Error connecting to StoryBrand API:', error);
        const status = error.response?.status || HttpStatusCode.InternalServerError;
        const message = error.response?.data?.message || 'Error connecting to StoryBrand API';
        throw new CustomError(message, status);
      }
      throw new CustomError('Error creating StoryBrand account', HttpStatusCode.InternalServerError);
    }
  }

  /**
   * Creates a new StoryBrand account for the specified client
   * @param clientId Client ID
   * @param accountData Account data to create (email, password, firstName, lastName)
   * @returns The created account
   */
  public async createAccount(clientId: string, accountData: Record<string, any>) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new CustomError(
        "Invalid client ID format",
        HttpStatusCode.BadRequest
      );
    }

    try {
      const client = await models.clients.findById(clientId);
      if (!client) {
        throw new CustomError("Client not found", HttpStatusCode.NotFound);
      }
      
      // Check if an account already exists for this client
      const existingAccount = await models.mvpAccounts.findOne({
        client: clientId,
        mvpType: this.mvpType
      });
      
      if (existingAccount) {
        throw new CustomError(
          "This client already has a StoryBrand account",
          HttpStatusCode.Conflict
        );
      }

      // Validate required fields
      const { email, password, firstName, lastName } = accountData;
      if (!email || !password || password.length < 6) {
        throw new CustomError(
          "Email and password are required. Password must be at least 6 characters long.",
          HttpStatusCode.BadRequest
        );
      }

      // Send the password without hashing to the external service
      // This allows the external service to handle its own password security
      
      // Create the account in the external StoryBrand service
      const externalAccount = await this.createExternalAccount({
        email,
        password, // Send original password without hashing
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        clientReference: clientId // Reference to the client in our system
      });

      // Save in the generic mvpAccounts model
      const newAccount = await models.mvpAccounts.create({
        client: clientId,
        mvpType: this.mvpType,
        accountData: externalAccount,
        active: true
      });

      return newAccount;
    } catch (error: unknown) {
      console.error('Error in createAccount:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Error creating StoryBrand account', HttpStatusCode.InternalServerError);
    }
  }

  /**
   * Changes the password for a StoryBrand account associated with the specified client
   * @param clientId Client ID
   * @param newPassword New password to set
   * @returns The updated account
   */
  public async changePassword(clientId: string, newPassword: string) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new CustomError(
        "Invalid client ID format",
        HttpStatusCode.BadRequest
      );
    }

    if (!newPassword || newPassword.length < 6) {
      throw new CustomError(
        "New password is required and must be at least 6 characters long.",
        HttpStatusCode.BadRequest
      );
    }

    try {
      // Find the account for this client
      const account = await models.mvpAccounts.findOne({
        client: clientId,
        mvpType: this.mvpType
      });

      if (!account) {
        throw new CustomError("StoryBrand account not found", HttpStatusCode.NotFound);
      }

      // Get the external account ID from the stored account data
      // Based on the log, the ID is nested inside accountData.user._id
      const externalAccountId = account.accountData?.user?._id || account.accountData?.id || account.accountData?._id;
      if (!externalAccountId) {
        throw new CustomError("External account reference not found", HttpStatusCode.InternalServerError);
      }

      // Call the external StoryBrand API to change the password
      try {
        const response = await axios.put(`${this.baseUrl}/api/storybrand-account/password`, {
          userId: externalAccountId,
          newPassword
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Update the local account data with any changes from the external service
        if (response.data && response.data.user) {
          account.accountData = { ...account.accountData, ...response.data.user };
          await account.save();
        }

        return account;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error('Error connecting to StoryBrand API for password change:', error);
          const status = error.response?.status || HttpStatusCode.InternalServerError;
          const message = error.response?.data?.message || 'Error changing password in StoryBrand API';
          throw new CustomError(message, status);
        }
        throw new CustomError('Error changing StoryBrand account password', HttpStatusCode.InternalServerError);
      }
    } catch (error: unknown) {
      console.error('Error in changePassword:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Error changing StoryBrand account password', HttpStatusCode.InternalServerError);
    }
  }

  /**
   * Deletes a StoryBrand account associated with the specified client
   * @param clientId Client ID
   * @returns Success message
   */
  public async deleteAccount(clientId: string) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new CustomError(
        "Invalid client ID format",
        HttpStatusCode.BadRequest
      );
    }

    try {
      // Find the account for this client
      const account = await models.mvpAccounts.findOne({
        client: clientId,
        mvpType: this.mvpType
      });

      if (!account) {
        throw new CustomError("StoryBrand account not found", HttpStatusCode.NotFound);
      }

      // Get the external account ID from the stored account data
      // Based on the log, the ID is nested inside accountData.user._id
      const externalAccountId = account.accountData?.user?._id || account.accountData?.id || account.accountData?._id;
      if (!externalAccountId) {
        throw new CustomError("External account reference not found", HttpStatusCode.InternalServerError);
      }

      // Call the external StoryBrand API to delete the account
      try {
        await axios.delete(`${this.baseUrl}/api/storybrand-account/${externalAccountId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Delete the local account record
        await models.mvpAccounts.findByIdAndDelete(account._id);

        return { message: "StoryBrand account deleted successfully" };
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error('Error connecting to StoryBrand API for account deletion:', error);
          const status = error.response?.status || HttpStatusCode.InternalServerError;
          const message = error.response?.data?.message || 'Error deleting account in StoryBrand API';
          throw new CustomError(message, status);
        }
        throw new CustomError('Error deleting StoryBrand account', HttpStatusCode.InternalServerError);
      }
    } catch (error: unknown) {
      console.error('Error in deleteAccount:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Error deleting StoryBrand account', HttpStatusCode.InternalServerError);
    }
  }

  /**
   * Gets all MVP accounts associated with a specific client
   * @param clientId Client ID
   * @returns Array of MVP accounts
   */
  public async getAccountsByClientId(clientId: string) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new CustomError(
        "Invalid client ID format",
        HttpStatusCode.BadRequest
      );
    }

    try {
      // Find all MVP accounts for this client (not just StoryBrand)
      const accounts = await models.mvpAccounts.find({
        client: clientId
      }).lean();

      // If no accounts found, return empty array instead of throwing error
      if (!accounts || accounts.length === 0) {
        return [];
      }

      // Return the accounts with sensitive data removed
      return accounts.map(account => ({
        _id: account._id,
        client: account.client,
        mvpType: account.mvpType,
        active: account.active,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        // Include basic account info but remove sensitive data
        accountInfo: account.accountData?.user ? {
          email: account.accountData.user.email,
          firstName: account.accountData.user.firstName,
          lastName: account.accountData.user.lastName,
          role: account.accountData.user.role,
          createdAt: account.accountData.user.createdAt
        } : null
      }));
    } catch (error: unknown) {
      console.error('Error in getAccountsByClientId:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Error retrieving MVP accounts', HttpStatusCode.InternalServerError);
    }
  }
}