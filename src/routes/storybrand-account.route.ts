import express from 'express';
import {
  createStorybrandAccountController,
  adminChangePasswordController,
  adminDeleteUserAccountController,
  getClientMvpAccountsController
} from '../controllers/storybrand-account.controller';

const router = express.Router();

// Public StoryBrand Account routes
router.post('/', createStorybrandAccountController);

// Client routes
router.get('/client/:clientId', getClientMvpAccountsController);

// Admin routes
router.put('/password', adminChangePasswordController);
router.delete('/:userId', adminDeleteUserAccountController);

export default router;