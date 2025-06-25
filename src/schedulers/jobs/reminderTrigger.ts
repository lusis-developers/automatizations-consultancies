import 'dotenv/config'
import cron from "node-cron";
import axios from "axios";


const REMINDER_ENDPOINT_URL = `${process.env.BACKEND_URL}/api/business/send-upload-reminders`;

/**
 * Esta función es la que se ejecuta a la hora programada.
 * Solo hace una llamada POST al endpoint.
 */
const executeReminderEndpoint = async () => {
  console.log(`[Job] Disparando la ruta de recordatorios: ${REMINDER_ENDPOINT_URL}`);
  try {
    await axios.post(REMINDER_ENDPOINT_URL);
    console.log("[Job] La ruta de recordatorios fue ejecutada exitosamente.");
  } catch (error) {
    console.error("[Job] Hubo un error al ejecutar la ruta de recordatorios:", error);
  }
};

/**
 * Esta función configura la programación del job.
 */
export const scheduleReminderJob = () => {
  cron.schedule("03 16 25 6 3", executeReminderEndpoint, {
    timezone: "America/Guayaquil",
  });
  console.log("[Scheduler] Job de recordatorios programado para las 11:00 AM (Hora Ecuador).");
};