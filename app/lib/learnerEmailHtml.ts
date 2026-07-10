export type LearnerEmailData = {
  learnerName: string;
  commitment: string;
  token: string;
  chartUrl: string;
  reported: number;
  total: number;
  baseUrl: string;
};

export function buildLearnerEmailHtml({
  learnerName,
  commitment,
  token,
  chartUrl,
  reported,
  total,
  baseUrl,
}: LearnerEmailData): string {
  const checkinUrl = `${baseUrl}/checkin?token=${token}`;
  const weeksLabel = `${reported} of ${total} week${total !== 1 ? 's' : ''} reported`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Weekly Check-In — LeaderFactor</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F2EC;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#78716C;margin:0 0 8px 0;">
      &#9632; WEEKLY CHECK-IN
    </p>
    <h1 style="font-size:28px;color:#1A1F2E;margin:0 0 12px 0;font-family:Georgia,serif;font-weight:bold;line-height:1.25;">
      Hey ${learnerName}, how did practice go?
    </h1>
    <p style="font-size:15px;color:#57534E;margin:0 0 28px 0;line-height:1.6;">
      Your commitment: <strong>${commitment}</strong>
    </p>

    <!-- One-tap response buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="padding-right:8px;width:33%;">
          <a href="${checkinUrl}"
             style="display:block;text-align:center;background-color:#22C55E;color:#ffffff;padding:14px 8px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            &#10003; Yes
          </a>
        </td>
        <td style="padding-right:8px;width:33%;">
          <a href="${checkinUrl}"
             style="display:block;text-align:center;background-color:#F59E0B;color:#ffffff;padding:14px 8px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            &#126; Partially
          </a>
        </td>
        <td style="width:33%;">
          <a href="${checkinUrl}"
             style="display:block;text-align:center;background-color:#9CA3AF;color:#ffffff;padding:14px 8px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            &#10005; Not this week
          </a>
        </td>
      </tr>
    </table>

    <!-- Dot-chart history -->
    <div style="background-color:#ffffff;border:1px solid #E7E5E4;border-radius:8px;padding:24px;margin-bottom:32px;">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#A8A29E;margin:0 0 6px 0;font-family:sans-serif;">
        &#9632; YOUR HISTORY
      </p>
      <p style="font-size:14px;color:#44403C;margin:0 0 12px 0;font-family:sans-serif;">${weeksLabel}</p>
      <img src="${chartUrl}" width="400" height="80"
           alt="${weeksLabel}"
           style="max-width:100%;display:block;" />
    </div>

    <p style="font-size:13px;color:#A8A29E;margin:0;font-family:sans-serif;">
      Misses are data, not failures. One tap keeps your record honest.
    </p>

  </div>
</body>
</html>`;
}
