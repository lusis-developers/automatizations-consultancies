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
}