import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateInvoice = async (order, userDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      const fileName = `invoice-${order._id}.pdf`;
      const uploadDir = path.join(__dirname, "../invoices");
      const filePath = path.join(uploadDir, fileName);

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* ================= HEADER ================= */
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("INVOICE", { align: "center" });

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Hawthorne Food Delivery", { align: "center" })
        .text("Thank you for your order!", { align: "center" });

      doc.moveDown(1.5);

      /* ================= ORDER INFO ================= */
      doc.fontSize(12).font("Helvetica-Bold").text("Order Information");

      doc.fontSize(10).font("Helvetica");
      doc.text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`);
      doc.text(`Status: ${order.status}`);

      doc.moveDown(1);

      /* ================= CUSTOMER ================= */
      doc.fontSize(12).font("Helvetica-Bold").text("Delivery Address");

      doc.fontSize(10).font("Helvetica");
      doc.text(`${order.address.firstName} ${order.address.lastName}`);
      doc.text(order.address.street);
      doc.text(
        `${order.address.city}, ${order.address.state} ${order.address.zipcode}`,
      );
      doc.text(`Phone: ${order.address.phone}`);

      doc.moveDown(1.5);

      /* ================= TABLE ================= */
      const itemX = 50;
      const qtyX = 300;
      const priceX = 380;
      const totalX = 470;

      // Header
      doc.fontSize(11).font("Helvetica-Bold");

      const headerY = doc.y;

      doc.text("Item", itemX, headerY);
      doc.text("Qty", qtyX, headerY, { width: 50, align: "center" });
      doc.text("Price", priceX, headerY, { width: 60, align: "right" });
      doc.text("Total", totalX, headerY, { width: 70, align: "right" });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      /* ================= ITEMS ================= */
      doc.fontSize(10).font("Helvetica");

      let subtotal = 0;

      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const y = doc.y;

        doc.text(item.name, itemX, y, { width: 230 });
        doc.text(item.quantity.toString(), qtyX, y, {
          width: 50,
          align: "center",
        });
        doc.text(`$${item.price.toFixed(2)}`, priceX, y, {
          width: 60,
          align: "right",
        });
        doc.text(`$${itemTotal.toFixed(2)}`, totalX, y, {
          width: 70,
          align: "right",
        });

        doc.moveDown(1);
      });

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      /* ================= SUMMARY ================= */
      const summaryX = 350;
      const valueX = 450;

      const deliveryCharge = 2;
      const total = subtotal + deliveryCharge;

      doc.font("Helvetica");

      doc.text("Subtotal:", summaryX, doc.y, {
        width: 100,
        align: "right",
      });
      doc.text(`$${subtotal.toFixed(2)}`, valueX, doc.y, {
        width: 100,
        align: "right",
      });

      doc.moveDown(0.5);

      doc.text("Delivery Charge:", summaryX, doc.y, {
        width: 100,
        align: "right",
      });
      doc.text(`$${deliveryCharge.toFixed(2)}`, valueX, doc.y, {
        width: 100,
        align: "right",
      });

      doc.moveDown(0.7);

      doc.font("Helvetica-Bold").fontSize(12);

      doc.text("Total Amount:", summaryX, doc.y, {
        width: 100,
        align: "right",
      });
      doc.text(`$${total.toFixed(2)}`, valueX, doc.y, {
        width: 100,
        align: "right",
      });

      doc.moveDown(2);

      /* ================= FOOTER ================= */
      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for ordering from Hawthorne!", {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
