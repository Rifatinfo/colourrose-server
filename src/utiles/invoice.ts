import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

type OrderWithItems = {
  id: string
  name: string
  phone: string
  address: string
  state: string
  paymentMethod: string
  subtotal: number
  totalAmount: number
  createdAt: Date
  items: {
    productName: string
    price: number
    quantity: number
    total: number
    color?: string | null
    size?: string | null
  }[]
}


export const generateInvoice = async (
  order: OrderWithItems,
  filePath: string
) => {
  const doc = new PDFDocument({ margin: 40 })

  doc.pipe(fs.createWriteStream(filePath))

  /* =========================
     HEADER
  ========================== */
  const logoPath = path.join(process.cwd(), "src/assets/logo.png")

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 40, { width: 120 })
  }

  doc
    .fontSize(20)
    .text("INVOICE", 400, 45, { align: "right" })
    .fontSize(10)
    .text(`Invoice No: ${order.id}`, { align: "right" })
    .text(`Date: ${order.createdAt.toDateString()}`, {
      align: "right",
    })

  doc.moveDown(3)

  /* =========================
     CUSTOMER INFO
  ========================== */
  doc
    .fontSize(12)
    .text("Bill To:", { underline: true })
    .moveDown(0.5)
    .fontSize(10)
    .text(order.name)
    .text(order.phone)
    .text(order.address)
    .text(order.state)

  doc.moveDown(2)

  /* =========================
     TABLE HEADER
  ========================== */
  const tableTop = doc.y

  doc
    .fontSize(10)
    .text("Product", 40, tableTop)
    .text("Qty", 280, tableTop)
    .text("Price", 330, tableTop)
    .text("Total", 430, tableTop)

  doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke()

  /* =========================
     TABLE ROWS
  ========================== */
  let y = tableTop + 25

  order.items.forEach((item) => {
    const variant = [
      item.color ? `Color: ${item.color}` : "",
      item.size ? `Size: ${item.size}` : "",
    ]
      .filter(Boolean)
      .join(", ")

    doc
      .fontSize(9)
      .text(
        `${item.productName}${variant ? ` (${variant})` : ""}`,
        40,
        y,
        { width: 220 }
      )
      .text(item.quantity.toString(), 280, y)
      .text(`${item.price.toFixed(2)} ৳`, 330, y)
      .text(`${item.total.toFixed(2)} ৳`, 430, y)

    y += 25
  })

  doc.moveDown(2)

  /* =========================
     TOTALS
  ========================== */
  doc
    .fontSize(10)
    .text(`Subtotal:`, 350, y)
    .text(`${order.subtotal.toFixed(2)} ৳`, 450, y)

  y += 15

  doc
    .font("Helvetica-Bold")
    .text(`Total:`, 350, y)
    .text(`${order.totalAmount.toFixed(2)} ৳`, 450, y)

  doc.font("Helvetica")

  /* =========================
     PAYMENT INFO
  ========================== */
  doc.moveDown(3)
  doc
    .fontSize(9)
    .text(`Payment Method: ${order.paymentMethod}`)
    .text("Thank you for your purchase!")

  /* =========================
     FOOTER
  ========================== */
  doc
    .fontSize(8)
    .fillColor("gray")
    .text(
      "This is a system generated invoice. No signature required.",
      40,
      760,
      { align: "center" }
    )

  doc.end()
}
