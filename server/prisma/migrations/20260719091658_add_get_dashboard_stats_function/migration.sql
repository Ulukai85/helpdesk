-- Computes all dashboard metrics in a single round trip: total/open/AI-resolved
-- ticket counts, AI resolution percentage, average resolution time, and a
-- zero-filled 30-day (UTC) daily ticket count series.
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'totalTickets', (SELECT COUNT(*) FROM "Ticket"),
    'openTickets', (SELECT COUNT(*) FROM "Ticket" WHERE status = 'OPEN'),
    'aiResolvedTickets', (
      SELECT COUNT(DISTINCT "ticketId") FROM "TicketReply" WHERE "authorType" = 'AI'
    ),
    'aiResolvedPercentage', (
      CASE (SELECT COUNT(*) FROM "Ticket")
        WHEN 0 THEN 0
        ELSE (
          SELECT COUNT(DISTINCT "ticketId")::float FROM "TicketReply" WHERE "authorType" = 'AI'
        ) / (SELECT COUNT(*) FROM "Ticket") * 100
      END
    ),
    'averageResolutionTimeMs', (
      SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000)
      FROM "Ticket"
      WHERE status IN ('RESOLVED', 'CLOSED')
    ),
    'ticketsPerDay', (
      SELECT COALESCE(
        json_agg(
          json_build_object('date', to_char(day.d, 'YYYY-MM-DD'), 'count', COALESCE(counts.count, 0))
          ORDER BY day.d
        ),
        '[]'::json
      )
      FROM generate_series(
        ((now() AT TIME ZONE 'UTC')::date - INTERVAL '29 days')::timestamp,
        ((now() AT TIME ZONE 'UTC')::date)::timestamp,
        INTERVAL '1 day'
      ) AS day(d)
      LEFT JOIN (
        SELECT "createdAt"::date AS day, COUNT(*) AS count
        FROM "Ticket"
        WHERE "createdAt" >= (now() AT TIME ZONE 'UTC')::date - INTERVAL '29 days'
        GROUP BY "createdAt"::date
      ) counts ON counts.day = day.d::date
    )
  );
$$;
