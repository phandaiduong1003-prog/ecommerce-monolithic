import prisma from "../config/prisma.js";

export async function createOrder(req, res) {
  try {
    const uid = req.user.uid;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "items are required",
      });
    }

    for (const item of items) {
      if (
        !Number.isInteger(item.pid) ||
        !Number.isInteger(item.qty) ||
        item.qty <= 0
      ) {
        return res.status(400).json({
          message: "Each item must have valid pid and qty",
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const products = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: {
            pid: item.pid,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.pid} not found`);
        }

        if (product.quantity < item.qty) {
          throw new Error(
            `Product ${product.pname} does not have enough quantity`
          );
        }

        products.push({
          product,
          qty: item.qty,
        });
      }

      const order = await tx.order.create({
        data: {
          uid,
          createat: new Date(),
        },
      });

      for (const item of products) {
        await tx.orderDetail.create({
          data: {
            oid: order.oid,
            pid: item.product.pid,
            qty: item.qty,
            unit_price: item.product.price,
          },
        });

        await tx.product.update({
          where: {
            pid: item.product.pid,
          },
          data: {
            quantity: {
              decrement: item.qty,
            },
          },
        });
      }

      const shipment = await tx.shipment.create({
        data: {
          oid: order.oid,
          status: "pending",
        },
      });

      return {
        order,
        shipment,
      };
    });

    const fullOrder = await prisma.order.findUnique({
      where: {
        oid: result.order.oid,
      },
      include: {
        user: {
          select: {
            uid: true,
            username: true,
            fullname: true,
          },
        },
        details: {
          include: {
            product: true,
          },
        },
        shipments: true,
      },
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: fullOrder,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message: "Order failed",
      error: error.message,
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const oid = Number(req.params.oid);

    if (!Number.isInteger(oid)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        oid,
        uid: req.user.uid,
      },
      include: {
        user: {
          select: {
            uid: true,
            username: true,
            fullname: true,
          },
        },
        details: {
          include: {
            product: true,
          },
        },
        shipments: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Cannot get order",
      error: error.message,
    });
  }
}