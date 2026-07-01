import client from "./client";

export interface TriggerEventResponse {
  success: boolean;
  triggered: number;
  results: Array<{
    installation_id: string;
    execution_id?: string;
    status: string;
    error?: string;
  }>;
}

export async function triggerEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  orgId: string
): Promise<TriggerEventResponse> {
  const response = await client.post<TriggerEventResponse>(
    "/api/workflows/trigger",
    {
      event_type: eventType,
      event_data: eventData,
      org_id: orgId,
    }
  );
  return response.data;
}
