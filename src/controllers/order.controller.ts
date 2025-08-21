import { Response } from "express";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import OrderModel, {
  orderDTO,
  OrderStatus,
  TypeOrder,
  TypeVoucher,
} from "../models/order.model";
import TicketModel from "../models/ticket.model";
import { FilterQuery } from "mongoose";
import { getId } from "../utils/id";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      const payload = {
        ...req.body,
        createdBy: userId,
      } as TypeOrder;

      await orderDTO.validate(payload);

      const ticket = await TicketModel.findById(payload.ticket);
      if (!ticket) return response.notFound(res, "Ticket not found");
      if (ticket.quantity < payload.quantity)
        return response.error(res, null, "Ticket quantity is not enough");

      const total: number = +ticket?.price * +payload.quantity;

      Object.assign(payload, {
        ...payload,
        total,
      });

      const result = await OrderModel.create(payload);

      response.success(res, result, "Success create an order");
    } catch (error) {
      response.error(res, error, "Failed to create an order");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    try {
      const buildQuery = (filter: any) => {
        let query: FilterQuery<TypeOrder> = {};

        if (filter.search) query.$text = { $search: filter.search };

        return query;
      };

      const { limit = 10, page = 1, search } = req.query;

      const query = buildQuery({
        search,
      });

      const result = await OrderModel.find(query)
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const count = await OrderModel.countDocuments(query).exec();
      response.pagination(
        res,
        result,
        {
          current: +page,
          total: count,
          totalPages: Math.ceil(count / +limit),
        },
        "Success get all orders"
      );
    } catch (error) {
      response.error(res, error, "Failed find all orders");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;
      const result = await OrderModel.findOne({ orderId });

      if (!result) return response.notFound(res, "Order not found");

      response.success(res, result, "Success find one order");
    } catch (error) {
      response.error(res, error, "Failed find one order");
    }
  },

  async findAllByMember(req: IReqUser, res: Response) {
    try {
      const buildQuery = (filter: any) => {
        const userId = req.user?.id;
        let query: FilterQuery<TypeOrder> = {
          createdBy: userId,
        };

        if (filter.search) query.$text = { $search: filter.search };

        return query;
      };

      const { limit = 10, page = 1, search } = req.query;

      const query = buildQuery({
        search,
      });

      const result = await OrderModel.find(query)
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const count = await OrderModel.countDocuments(query).exec();
      response.pagination(
        res,
        result,
        {
          current: +page,
          total: count,
          totalPages: Math.ceil(count / +limit),
        },
        "Success get all orders by member"
      );
    } catch (error) {
      response.error(res, error, "Failed find all orders by member");
    }
  },

  async complete(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const order = await OrderModel.findOne({ orderId, createdBy: userId });

      if (!order) return response.notFound(res, "Order not found");

      if (order.status == OrderStatus.COMPLETED)
        return response.error(res, null, "Order already completed");

      const vouchers: TypeVoucher[] = Array.from(
        { length: order.quantity },
        () => {
          return {
            isPrint: false,
            voucherId: getId(),
          } as TypeVoucher;
        }
      );

      const result = await OrderModel.findOneAndUpdate(
        {
          orderId,
          createdBy: userId,
        },
        {
          vouchers,
          status: OrderStatus.COMPLETED,
        },
        {
          new: true,
        }
      );

      const ticket = await TicketModel.findById(order.ticket);
      if (!ticket) return response.notFound(res, "Ticket and order not found");

      await TicketModel.updateOne(
        {
          _id: ticket._id,
        },
        {
          quantity: ticket.quantity - order.quantity,
        }
      );

      response.success(res, result, "Success to complete an order");
    } catch (error) {
      response.error(res, error, "Failed to complete an order");
    }
  },

  async pending(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;

      const order = await OrderModel.findOne({ orderId });

      if (!order) return response.notFound(res, "Order not found");

      if (order.status == OrderStatus.COMPLETED)
        return response.error(res, null, "This order has been completed");

      if (order.status == OrderStatus.PENDING)
        return response.error(
          res,
          null,
          "This order currently in payment pending"
        );

      const result = await OrderModel.findOneAndUpdate(
        {
          orderId,
        },
        {
          status: OrderStatus.PENDING,
        },
        {
          new: true,
        }
      );

      response.success(res, result, "Success to pending an order");
    } catch (error) {
      response.error(res, error, "Failed to pending an order");
    }
  },

  async cancelled(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;

      const order = await OrderModel.findOne({ orderId });

      if (!order) return response.notFound(res, "Order not found");

      if (order.status == OrderStatus.COMPLETED)
        return response.error(res, null, "This order has been completed");

      if (order.status == OrderStatus.CANCELLED)
        return response.error(res, null, "This order has been cancelled");

      const result = await OrderModel.findOneAndUpdate(
        {
          orderId,
        },
        {
          status: OrderStatus.CANCELLED,
        },
        {
          new: true,
        }
      );

      response.success(res, result, "Success to cancelled an order");
    } catch (error) {
      response.error(res, error, "Failed to cancelled an order");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;
      const result = await OrderModel.findOneAndDelete(
        {
          orderId,
        },
        {
          new: true,
        }
      );
      if (!result) return response.notFound(res, "Order not found");
      response.success(res, result, "Success to remove an order");
    } catch (error) {
      response.error(res, error, "Failed to remove an order");
    }
  },

  async completeOrder(orderId: string) {
    const order = await OrderModel.findOne({ orderId });

    if (!order) throw new Error("Order not found");
    if (order.status === OrderStatus.COMPLETED)
      throw new Error("Order already completed");

    const vouchers: TypeVoucher[] = Array.from(
      { length: order.quantity },
      () => {
        return {
          isPrint: false,
          voucherId: getId(),
        } as TypeVoucher;
      }
    );

    const result = await OrderModel.findOneAndUpdate(
      { orderId },
      { vouchers, status: OrderStatus.COMPLETED },
      { new: true }
    );

    const ticket = await TicketModel.findById(order.ticket);
    if (!ticket) throw new Error("Ticket not found");

    await TicketModel.updateOne(
      { _id: ticket._id },
      { quantity: ticket.quantity - order.quantity }
    );

    return result;
  },

  async midtransNotification(req: IReqUser, res: Response) {
    try {
      const notification = req.body;
      // console.log("📩 Notifikasi Midtrans:", notification);

      const { order_id, transaction_status } = notification;

      // ambil order
      const order = await OrderModel.findOne({ orderId: order_id });
      if (!order) return response.notFound(res, "Order not found");

      // mapping midtrans status ke fungsi order
      if (transaction_status === "settlement") {
        // panggil fungsi complete
        await this.completeOrder(order_id);
        // console.log(`✅ Order ${order_id} sukses dibayar`);
      }

      if (transaction_status === "pending") {
        console.log(`⏳ Order ${order_id} pending`);
      }

      if (
        transaction_status === "expire" ||
        transaction_status === "cancel" ||
        transaction_status === "deny"
      ) {
        await OrderModel.findOneAndUpdate(
          { orderId: order_id },
          { status: OrderStatus.CANCELLED },
          { new: true }
        );
        // console.log(`❌ Order ${order_id} dibatalkan/expired`);
      }

      // balas OK agar Midtrans tidak retry
      return res.status(200).json({ message: "Notification processed" });
    } catch (error) {
      console.error("🔥 Error midtransNotification:", error);
      return response.error(res, error, "Failed to process notification");
    }
  },
};
