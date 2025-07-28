import { Response } from "express";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import OrderModel, {
  orderDAO,
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

      await orderDAO.validate(payload);

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
    } catch (error) {}
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

  async findAllByMember(req: IReqUser, res: Response) {},

  async complete(req: IReqUser, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const order = await OrderModel.findById({ orderId, createdBy: userId });

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
    } catch (error) {
      response.error(res, error, "Failed to pending an order");
    }
  },

  async cancelled(req: IReqUser, res: Response) {
    try {
    } catch (error) {
      response.error(res, error, "Failed to cancelled an order");
    }
  },
};
