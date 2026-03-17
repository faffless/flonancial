import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SubmissionConfirmationParams = {
  toEmail: string;
  businessName: string;
  quarterStart: string;
  quarterEnd: string;
  turnover: number;
  expenses: number;
  taxYear: string;
  submittedAt: string;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function sendSubmissionConfirmation(params: SubmissionConfirmationParams) {
  const {
    toEmail,
    businessName,
    quarterStart,
    quarterEnd,
    turnover,
    expenses,
    taxYear,
    submittedAt,
  } = params;

  const submittedDate = new Date(submittedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await resend.emails.send({
    from: "Flonancial <hello@flonancial.co.uk>",
    to: toEmail,
    subject: `MTD submission confirmed — ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #DEE9F8; color: #0F1C2E; padding: 32px 24px; border-radius: 12px;">
        <p style="font-size: 20px; font-weight: bold; margin: 0 0 8px;">Flonancial</p>
        <p style="font-size: 13px; color: #3B5A78; margin: 0 0 32px;">Free MTD tax submissions for the self-employed</p>
        <p style="font-size: 15px; margin: 0 0 8px;">Hi there,</p>
        <p style="font-size: 15px; margin: 0 0 24px;">Your quarterly MTD update has been successfully submitted to HMRC.</p>
        <div style="background: #CCE0F5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Business</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${businessName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Tax year</td>
              <td style="padding: 6px 0; text-align: right;">${taxYear}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Period</td>
              <td style="padding: 6px 0; text-align: right;">${formatDate(quarterStart)} to ${formatDate(quarterEnd)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Turnover</td>
              <td style="padding: 6px 0; text-align: right;">${formatCurrency(turnover)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Expenses</td>
              <td style="padding: 6px 0; text-align: right;">${formatCurrency(expenses)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3B5A78;">Submitted</td>
              <td style="padding: 6px 0; text-align: right;">${submittedDate}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 13px; color: #3B5A78; margin: 0 0 8px;">Please verify your submission was accepted by checking your HMRC online account directly.</p>
        <p style="font-size: 13px; color: #3B5A78; margin: 0 0 32px;">If you did not make this submission or have any concerns, contact us immediately at hello@flonancial.co.uk.</p>
        <p style="font-size: 13px; color: #3B5A78; margin: 0;">hello@flonancial.co.uk</p>
      </div>
    `,
  });
}