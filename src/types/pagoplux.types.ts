export interface IPagopluxWebhookResponse {
  amount: string;
  cardInfo: string;
  cardType: string;
  clientID: string;
  clientName: string;
  date: string;
  id_transaccion: string;
  state: string;
  token: string;
  typePayment: string;
  tipoPago: string;
  bank: string;
  detail: string;
  rename: string;
  extras: string | null;
}