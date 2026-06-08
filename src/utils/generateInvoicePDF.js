import html2pdf from "html2pdf.js";
import brandLogoUrl from "../assets/images/brand-logo-light.png";

// ─── INVOICE CALCULATION LOGIC (mirrors TrackOrder & OrderSummary) ───
//
//  itemsPrice   = MRP total (originalPrice)
//  savings      = product-level markdown  (MRP - selling price)
//  couponDiscount = coupon/promo savings  (category-specific, from Checkout)
//  subTotal     = itemsPrice - savings - couponDiscount  ← GST base
//  gst          = subTotal × 18%
//  total        = subTotal + gst
//
export async function generateInvoicePDF({
  order,
  userAddress,
  itemsPrice,
  savings,
  couponDiscount = 0,
  finalPrice,      // this param is kept for backward-compat but not used for total calc
}) {
  if (!order) return;

  const qty = Number(order.quantity) || 1;
  const origTotal = Number(itemsPrice) || 0;
  const disc = Number(savings) || 0;
  const cpnDisc = Number(couponDiscount) || 0;

  // subTotal is the GST base — after BOTH product discount AND coupon discount
  const subTotal = origTotal - disc - cpnDisc > 0
    ? origTotal - disc - cpnDisc
    : 0;
  const gst = Math.round(subTotal * 0.18 * 100) / 100;
  const total = Math.round(subTotal + gst);

  const unitPrice =
    qty > 0 ? (origTotal / qty).toFixed(2) : origTotal.toFixed(2);
  const fmt = (n) => `₹ ${Number(n).toFixed(2)}`;

  const rawId = String(order.id || "00000").padStart(6, "0");
  const today = new Date();
  const dd = today.getDate().toString().padStart(2, "0");
  const mm = (today.getMonth() + 1).toString().padStart(2, "0");
  const yy = today.getFullYear().toString().slice(-2);
  const yyyy = today.getFullYear();
  const invoiceNo = `INV-${rawId}-${dd}${mm}${yy}`;
  const orderDate = order.time || order.date || `${dd}-${mm}-${yyyy}`;

  const addr = userAddress || {};
  const addrName = addr.name || order.customer || "Customer";
  const addrLine = addr.address || order.address || "";
  const addrCity = addr.city || "";
  const addrState = addr.state || "";
  const addrPin = addr.pin || "";
  const addrMobile = addr.mobile || addr.contact || order.mobileNumber || "";
  const cityLine =
    [addrCity, addrState].filter(Boolean).join(", ") +
    (addrPin ? ` - ${addrPin}` : "");

  const status = order.status || "Order Placed";
  const isDelivered =
    status.toLowerCase() === "delivered" ||
    status.toLowerCase() === "completed";
  const statusBg = isDelivered ? "#d1fae5" : "#fef9c3";
  const statusColor = isDelivered ? "#065f46" : "#92400e";
  const statusDot = isDelivered ? "#22c55e" : "#f59e0b";

  const productImg = order.image || order.img || "";
  const payMode = order.paymentMode || order.paymentMethod || "Online";

  // Coupon code badge for invoice
  const appliedCouponCode =
    order.paymentDetails?.appliedCouponCode || "";

  const html = `
    <div id="star-invoice" style="
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      width: 794px;
      padding: 36px 40px;
      background: #ffffff;
      color: #1a1a2e;
      box-sizing: border-box;
    ">

      <!-- HEADER -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px;">

        <!-- Left: Brand -->
        <div style="display:flex; align-items:flex-start; gap:14px;">
          <img
            src="${brandLogoUrl}"
            alt="Star Bags Logo"
            style="height:58px; width:auto; object-fit:contain; flex-shrink:0;"
          />
          <div>
            <div style="font-size:20px; font-weight:800; letter-spacing:1px; color:#1a1a2e;">STAR BAGS</div>
            <div style="font-size:10.5px; font-weight:500; color:#7c3aed; letter-spacing:0.4px;">Carry Your Confidence</div>
            <div style="margin-top:12px; font-size:10.5px; color:#374151; line-height:1.8;">
              <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:4px;">
                <span style="color:#7c3aed; margin-top:1px;">📍</span>
                <div style="display:flex; flex-direction:column;">
                  <span>Address:</span>
                  <span>No 554, Vannikamvalam Opposite,<br>Old Bus Stand Road, Bhavani Main Road,<br>Perundurai - 638052, Tamil Nadu</span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="color:#7c3aed;">🪪</span>
                <span>GSTIN: 29ABCD123F1ZS</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:#7c3aed;">📞</span>
                <span>Phone: +91 97999 02475</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Invoice Info -->
        <div style="text-align:left; min-width:230px;">
          <div style="font-size:23px; font-weight:800; color:#1a1a2e; letter-spacing:1px; margin-bottom:6px;">TAX INVOICE</div>
          <div style="width:44px; height:3px; background:#7c3aed; border-radius:2px; margin-bottom:16px;"></div>
          <table style="font-size:11px; width:100%; border-collapse:collapse;">
            <tr>
              <td style="color:#6b7280; padding:3px 0; white-space:nowrap;">Invoice No</td>
              <td style="color:#374151; padding:3px 0 3px 6px; white-space:nowrap;">: ${invoiceNo}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; padding:3px 0;">Order ID</td>
              <td style="color:#374151; padding:3px 0 3px 6px;">: #${rawId}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; padding:3px 0;">Order Date</td>
              <td style="color:#374151; padding:3px 0 3px 6px;">: ${orderDate}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; padding:3px 0;">Payment Mode</td>
              <td style="color:#374151; padding:3px 0 3px 6px;">: ${payMode}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; padding:3px 0;">Payment</td>
              <td style="color:#374151; padding:3px 0 3px 6px; font-weight:600;">: ${fmt(total)}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; padding:3px 0; vertical-align:middle;">Status</td>
              <td style="padding:3px 0 3px 6px; vertical-align:middle;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:#374151;">:</span>
                  <div style="
                    display:flex; align-items:center; gap:5px;
                    background:${statusBg}; color:${statusColor};
                    padding:3px 10px; border-radius:20px; font-size:10px; font-weight:600;
                    line-height:1.4;
                  ">
                    <div style="width:6px; height:6px; border-radius:50%; background:${statusDot}; flex-shrink:0;"></div>
                    <div style="color:${statusColor};">${status}</div>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- SHIPPING ADDRESS -->
      <div style="
        background:#f5f3ff; border:1px solid #ede9fe; border-radius:10px;
        padding:16px 20px; margin-bottom:24px;
        display:flex; align-items:center; gap:16px;
      ">
        <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
          <div style="
            width:38px; height:38px; border-radius:50%;
            background:#ede9fe; display:flex; align-items:center; justify-content:center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div style="font-size:10px; font-weight:700; color:#7c3aed; letter-spacing:1px; text-transform:uppercase; line-height:1.4;">SHIPPING<br>ADDRESS</div>
        </div>
        <div style="width:1px; background:#c4b5fd; align-self:stretch;"></div>
        <div style="font-size:11.5px; color:#374151; line-height:1.7;">
          <div style="font-weight:700; font-size:12.5px; color:#1a1a2e;">${addrName}</div>
          <div style="max-width:420px;">${addrLine},</div>
          ${cityLine ? `<div style="max-width:420px;">${cityLine}</div>` : ""}
          ${addrMobile ? `<div style="display:flex; align-items:center; gap:5px; margin-top:4px;"><span style="color:#7c3aed;">📞</span> ${addrMobile}</div>` : ""}
        </div>
      </div>

      <!-- PRODUCT TABLE -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:22px; font-size:11.5px;">
        <thead>
          <tr style="background:#5b21b6; color:#ffffff;">
            <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px;">#</th>
            <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px;">Product</th>
            <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px;">Brand</th>
            <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px;">Size</th>
            <th style="padding:10px 12px; text-align:center; font-weight:600; font-size:11px;">Quantity</th>
            <th style="padding:10px 12px; text-align:right; font-weight:600; font-size:11px; white-space:nowrap;">Unit Price</th>
            <th style="padding:10px 12px; text-align:right; font-weight:600; font-size:11px; white-space:nowrap;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:12px; vertical-align:middle; color:#6b7280; font-size:11px;">01</td>
            <td style="padding:12px; vertical-align:middle;">
              <div style="display:flex; align-items:center; gap:10px;">
                ${
                  productImg
                    ? `<img src="${productImg}" alt="product" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #e5e7eb;" crossorigin="anonymous"/>`
                    : `<div style="width:40px; height:40px; border-radius:6px; border:1px solid #e5e7eb; background:#ede9fe; display:flex; align-items:center; justify-content:center;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                    </div>`
                }
                <span style="font-weight:600; color:#1a1a2e; font-size:11.5px;">${order.product || order.productName || "Product"}</span>
              </div>
            </td>
            <td style="padding:10px; vertical-align:middle; color:#374151; font-size:11px;">${order.brand || "Star Bags"}</td>
            <td style="padding:10px; vertical-align:middle; color:#374151; font-size:11px;">${order.size || "-"}</td>
            <td style="padding:10px; vertical-align:middle; text-align:center; color:#374151; font-size:11px;">${qty}</td>
            <td style="padding:10px; vertical-align:middle; text-align:right; color:#374151; font-size:11px; white-space:nowrap;">${fmt(unitPrice)}</td>
            <td style="padding:10px; vertical-align:middle; text-align:right; color:#1a1a2e; font-size:11px; white-space:nowrap;">${fmt(origTotal)}</td>
          </tr>
        </tbody>
      </table>

      <!-- PRICE SUMMARY -->
      <div style="display:flex; justify-content:flex-end; margin-bottom:32px;">
        <div style="width:295px;">

          <!-- Items total (MRP) -->
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #f3f4f6;">
            <span style="color:#374151;">Items (${qty})</span>
            <span style="color:#374151; font-weight:500; white-space:nowrap;">${fmt(origTotal)}</span>
          </div>

          <!-- Product discount row (only when present) -->
          ${disc > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #f3f4f6;">
            <span style="color:#374151;">Product discount</span>
            <span style="color:#22c55e; font-weight:500; white-space:nowrap;">-${fmt(disc)}</span>
          </div>` : ""}

          <!-- Coupon discount row (only when present) -->
          ${cpnDisc > 0 ? `
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #f3f4f6;">
            <span style="color:#374151; display:flex; align-items:center; gap:6px;">
              Coupon discount
              ${appliedCouponCode ? `<span style="background:#f0fdf4; display:none; color:#15803d; border:1px solid #bbf7d0; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700;">${appliedCouponCode}</span>` : ""}
            </span>
            <span style="color:#22c55e; font-weight:500; white-space:nowrap;">-${fmt(cpnDisc)}</span>
          </div>` : ""}

          <!-- Sub total = MRP - product discount - coupon discount -->
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #f3f4f6;">
            <span style="color:#374151;">Sub total</span>
            <span style="color:#374151; font-weight:500; white-space:nowrap;">${fmt(subTotal)}</span>
          </div>

          <!-- GST on sub total -->
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid #f3f4f6;">
            <span style="color:#374151;">GST Include (18%)</span>
            <span style="color:#374151; font-weight:500; white-space:nowrap;">${fmt(gst)}</span>
          </div>

          <!-- Shipping -->
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px dashed #e5e7eb;">
            <span style="color:#374151;">Shipping Fee</span>
            <span style="color:#374151; font-weight:500;">Free</span>
          </div>

          <!-- Grand Total -->
          <div style="display:flex; justify-content:space-between; font-size:14px; padding:10px 0 4px 0;">
            <span style="font-weight:700; color:#1a1a2e;">Total</span>
            <span style="font-weight:800; color:#7c3aed; font-size:15px; white-space:nowrap;">${fmt(total)}</span>
          </div>

          <!-- Savings callout (only when something was saved) -->
          ${(disc > 0 || cpnDisc > 0) ? `
          <div style="
            display:none; align-items:center; justify-content:center; gap:6px;
            background:#f0fdf4; border:1px solid #bbf7d0;
            border-radius:6px; padding:6px 12px; margin-top:6px;
            font-size:11px; color:#15803d; font-weight:600;
          ">
            🎉 You saved ${fmt(disc + cpnDisc)} on this order!
          </div>` : ""}

        </div>
      </div>

      <!-- FOOTER -->
      <div style="
        display:flex; justify-content:space-between; align-items:flex-end;
        border-top:1px solid #e5e7eb; padding-top:20px; margin-top:4px;
      ">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="
            width:40px; height:40px; border-radius:50%;
            background:#fce7f3; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
                stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div style="font-weight:700; font-size:12px; color:#1a1a2e;">Thankyou for shopping with STAR BAGS!</div>
            <div style="font-size:10px; color:#6b7280; margin-top:2px;">We truly appreciate your trust and support.</div>
          </div>
        </div>
        <div style="text-align:center;">
          <div style="
            font-family:'Segoe Script','Brush Script MT',cursive;
            font-size:15px; color:#1a1a2e; line-height:1; margin-bottom:6px;
            border-bottom:2px solid #1a1a2e; padding-bottom:4px; min-width:110px;
          ">Gokulnath</div>
          <div style="font-size:10px; color:#6b7280; font-weight:500;">Authorized Signature</div>
        </div>
      </div>

    </div>
  `;

  const container = document.createElement("div");
  container.style.cssText = "position:absolute; left:-9999px; top:-9999px;";
  container.innerHTML = html;
  document.body.appendChild(container);

  const element = container.querySelector("#star-invoice");

  const options = {
    margin: [0, 0, 0, 0],
    filename: `StarBags_Invoice_${rawId}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    document.body.removeChild(container);
  }
}