import { Router, type IRouter, type Response } from "express";
import { z } from "@workspace/api-zod";
import { EventServiceError, challengeEvent, getEventById, listEvents } from "../services/EventService";

const router: IRouter = Router();
const idSchema = z.string().trim().min(1).max(64);

function handleError(error: unknown, res: Response) {
  return res.status(error instanceof EventServiceError ? 400 : 500).json({
    error: error instanceof Error ? error.message : "Unexpected error",
  });
}

router.get("/events", async (_req, res) => {
  try {
    const activeEvents = await listEvents();
    return res.json(activeEvents);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/events/:id", async (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: "Invalid event id" });
  try {
    const event = await getEventById(parsed.data);
    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(event);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/events/challenge", async (req, res) => {
  const parsed = z.object({
    discordId: idSchema,
    eventId: idSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid event challenge parameters" });

  try {
    const result = await challengeEvent(parsed.data.discordId, parsed.data.eventId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
