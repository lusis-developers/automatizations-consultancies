import clients from "./clients.model";
import paymentsIntents from "./paymentsIntents.model";
import transactions from "./transactions.model";
import business from "./business.model";
import meetings from './meeting.model';
import mvpAccounts from './mvpAccount.model';
import { Checklist } from './checklist.model';

const models = {
  clients,
  paymentsIntents,
  transactions,
  business,
  meetings,
  mvpAccounts,
  checklists: Checklist,
};

export default models;
