/**
 * Receipt Email Helper
 * Generates aesthetically minimal and professional receipt emails for subscription charges
 */

/**
 * Generates HTML receipt email template
 * @param {Object} data - Receipt data
 * @param {string} data.userName - Customer name
 * @param {string} data.email - Customer email
 * @param {string} data.tier - Subscription tier (Basic, Pro)
 * @param {number} data.amount - Amount charged (in dollars)
 * @param {string} data.billingDate - Billing date
 * @param {string} data.nextBillingDate - Next billing date
 * @returns {string} HTML receipt template
 */
const generateReceiptHTML = (data) => {
  const { userName, email, tier, amount, billingDate, nextBillingDate } = data;

  // Tier colors for visual distinction
  const tierColors = {
    Basic: "#6366f1",
    Pro: "#f59e0b",
  };

  const tierColor = tierColors[tier] || "#6366f1";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quizzy AI - Receipt</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f8f9fb;
          color: #1f2937;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-wrapper {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 14px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 30px;
          color: #374151;
        }
        .receipt-details {
          background: #f9fafb;
          border-left: 4px solid ${tierColor};
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        .detail-value {
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 2px solid #e5e7eb;
          margin-top: 12px;
        }
        .price-label {
          color: #374151;
          font-size: 16px;
          font-weight: 700;
        }
        .price-value {
          color: ${tierColor};
          font-size: 18px;
          font-weight: 700;
        }
        .features {
          background: #f0f9ff;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .features h3 {
          color: ${tierColor};
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 15px;
        }
        .features-list {
          list-style: none;
        }
        .features-list li {
          padding: 8px 0;
          color: #374151;
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        .features-list li::before {
          content: "✓";
          color: ${tierColor};
          font-weight: bold;
          margin-right: 10px;
          font-size: 16px;
        }
        .footer-info {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          font-size: 13px;
          color: #6b7280;
        }
        .footer-info p {
          margin-bottom: 10px;
        }
        .footer-info p:last-child {
          margin-bottom: 0;
        }
        .support {
          text-align: center;
          padding: 30px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }
        .support p {
          margin-bottom: 10px;
        }
        .support a {
          color: ${tierColor};
          text-decoration: none;
          font-weight: 600;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <!-- Header -->
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
            <p>Your subscription has been successfully activated</p>
          </div>

          <!-- Main Content -->
          <div class="content">
            <div class="greeting">
              <p>Hi, ${userName}!</p>
              <p style="margin-top: 8px;">Thank you for upgrading to <strong>${tier}</strong> tier. Your payment has been processed successfully.</p>
            </div>

            <!-- Receipt Details -->
            <div class="receipt-details">
              <div class="detail-row">
                <span class="detail-label">Subscription Plan </span>
                <span class="detail-value">${tier}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Billing Date </span>
                <span class="detail-value">${billingDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Billing Date </span>
                <span class="detail-value">${nextBillingDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Frequency </span>
                <span class="detail-value">Monthly</span>
              </div>
              <div class="price-row">
                <span class="price-label">Amount Charged </span>
                <span class="price-value">$${amount.toFixed(2)}</span>
              </div>
            </div>

            <!-- Features -->
            <div class="features">
              <h3>${tier} Plan Includes</h3>
              <ul class="features-list">
                ${
                  tier === "Basic"
                    ? `
                  <li>35 Quiz generations per month</li>
                  <li>17 Flashcard sets per month</li>
                  <li>15 PDF uploads per month</li>
                  <li>15 PDF exports per month</li>
                  <li>Max 25 questions per quiz</li>
                  <li>Max 60 marks per quiz</li>
                `
                    : `
                  <li>Unlimited quiz generations</li>
                  <li>Unlimited flashcard sets</li>
                  <li>Unlimited PDF uploads</li>
                  <li>Unlimited PDF exports</li>
                  <li>Max 45 questions per quiz</li>
                  <li>Max 100 marks per quiz</li>
                `
                }
              </ul>
            </div>

            <!-- Billing Info -->
            <div class="footer-info">
              <p><strong>Billing Information:</strong></p>
              <p>Email: ${email}</p>
              <p>You will be charged <strong>$${amount.toFixed(
                2
              )}</strong> every month on the same date until you cancel.</p>
              <p>You can manage or cancel your subscription anytime from your account settings.</p>
            </div>

            <!-- Divider -->
            <div class="divider"></div>

            <!-- Support -->
            <div class="support">
              <p><strong>Questions?</strong></p>
              <p>If you need help or have any questions about your subscription, feel free to <a href="https://quizzy-ai.vercel.app/contact">contact our support team</a>.</p>
              <p>We're here to help and typically respond within 48 hours.</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get tier pricing information
 * @param {string} tier - Subscription tier
 * @returns {number} Monthly price
 */
const getTierPrice = (tier) => {
  const prices = {
    Basic: 4.99,
    Pro: 11.99,
  };
  return prices[tier] || 0;
};

export { generateReceiptHTML, getTierPrice };
