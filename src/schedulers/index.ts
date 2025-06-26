import { scheduleReminderJob } from "./jobs/reminderTrigger";

export const initializeSchedulers = () => {
  console.log("[Scheduler] Activando sistema de tareas programadas...");
  
  scheduleReminderJob();
  
  console.log("[Scheduler] Sistema activado.");
};